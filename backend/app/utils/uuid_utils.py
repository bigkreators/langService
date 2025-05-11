# backend/app/utils/uuid_utils.py
import uuid
from sqlalchemy.types import TypeDecorator, VARCHAR

class SqliteUUID(TypeDecorator):
    """SQLite-compatible UUID type.
    
    Uses a string in the SQLite database, but exposes it as a UUID in Python.
    """
    
    impl = VARCHAR
    cache_ok = True
    
    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        elif isinstance(value, uuid.UUID):
            return str(value)
        else:
            return str(uuid.UUID(value))
    
    def process_result_value(self, value, dialect):
        if value is None:
            return value
        else:
            return uuid.UUID(value)

