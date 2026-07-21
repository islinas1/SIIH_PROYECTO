from flask import current_app, g
from app.extensions import db
from app.modules.documentos.models import Documento
from app.core.storage import LocalStorage, generar_storage_key, calcular_hash
from app.core.errors import NotFoundError, ValidationError


class DocumentoService:

    @staticmethod
    def _storage() -> LocalStorage:
        return LocalStorage(current_app.config['UPLOAD_FOLDER'])

    @staticmethod
    def subir(archivo, entidad_tipo: str, entidad_id: int, id_paciente: int, categoria: str) -> Documento:
        storage_key = generar_storage_key(archivo.filename)
        hash_sha256 = calcular_hash(archivo.stream)

        archivo.stream.seek(0, 2)
        tamano = archivo.stream.tell()
        archivo.stream.seek(0)

        if tamano > 20_971_520:
            raise ValidationError('El archivo supera el límite de 20 MB')

        storage = DocumentoService._storage()
        storage.guardar(storage_key, archivo.stream)

        try:
            doc = Documento(
                storage_key=storage_key,
                nombre_original=archivo.filename,
                mime_type=archivo.mimetype,
                tamano_bytes=tamano,
                hash_sha256=hash_sha256,
                entidad_tipo=entidad_tipo,
                entidad_id=entidad_id,
                id_paciente=id_paciente,
                id_usuario_subio=g.current_user.id_usuario,
                categoria=categoria,
            )
            db.session.add(doc)
            db.session.commit()
        except Exception:
            storage.eliminar(storage_key)
            raise

        return doc

    @staticmethod
    def listar(entidad_tipo: str, entidad_id: int) -> list[Documento]:
        return db.session.execute(
            db.select(Documento).where(
                Documento.entidad_tipo == entidad_tipo,
                Documento.entidad_id == entidad_id,
            ).order_by(Documento.created_at.desc())
        ).scalars().all()

    @staticmethod
    def obtener(id_documento: int) -> Documento:
        doc = db.session.get(Documento, id_documento)
        if not doc:
            raise NotFoundError('Documento no encontrado')
        return doc

    @staticmethod
    def ruta_archivo(id_documento: int) -> tuple[str, str]:
        doc = DocumentoService.obtener(id_documento)
        ruta = DocumentoService._storage().ruta(doc.storage_key)
        return ruta, doc.nombre_original

    @staticmethod
    def eliminar(id_documento: int) -> None:
        doc = DocumentoService.obtener(id_documento)
        storage_key = doc.storage_key
        db.session.delete(doc)
        db.session.commit()
        DocumentoService._storage().eliminar(storage_key)
