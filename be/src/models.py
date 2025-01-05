from pydantic import BaseModel
from sqlalchemy import Column, Integer, String, ForeignKey

from database import Base

class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String)

class UserCreate(BaseModel):
    name: str

    class Config:
        from_attributes = True

class BeerRecord(Base):
    __tablename__ = 'beer_records'

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    weight = Column(Integer)
    timestamp = Column(Integer)

class AlcoholRecord(Base):
    __tablename__ = 'alcohol_records'

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    alcohol = Column(Integer)
    timestamp = Column(Integer)
