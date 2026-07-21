import os
import uuid
import hashlib
from abc import ABC, abstractmethod
from app.core.errors import ValidationError

EXTENSIONES_PERMITIDAS = {'.pdf', '.jpg', '.jpeg', '.png', '.dcm'}


def generar_storage_key(nombre_original):
    extension = os.path.splitext(nombre_original)[1].lower()
    if extension not in EXTENSIONES_PERMITIDAS:
        raise ValidationError(f'Extensión no permitida: {extension}')
    return uuid.uuid4().hex + extension


def calcular_hash(stream):
    sha256 = hashlib.sha256()
    for chunk in iter(lambda: stream.read(8192), b''):
        sha256.update(chunk)
    stream.seek(0)
    return sha256.hexdigest()


class StorageService(ABC):
    @abstractmethod
    def guardar(self, storage_key, stream):
        pass

    @abstractmethod
    def ruta(self, storage_key):
        pass

    @abstractmethod
    def eliminar(self, storage_key):
        pass


class LocalStorage(StorageService):
    def __init__(self, upload_folder):
        self.upload_folder = upload_folder

    def _dir(self, storage_key):
        return os.path.join(self.upload_folder, storage_key[:2])

    def guardar(self, storage_key, stream):
        directorio = self._dir(storage_key)
        os.makedirs(directorio, exist_ok=True)
        ruta_archivo = os.path.join(directorio, storage_key)
        with open(ruta_archivo, 'wb') as f:
            f.write(stream.read())
        return ruta_archivo

    def ruta(self, storage_key):
        return os.path.join(self._dir(storage_key), storage_key)

    def eliminar(self, storage_key):
        ruta_archivo = self.ruta(storage_key)
        if os.path.exists(ruta_archivo):
            os.remove(ruta_archivo)
