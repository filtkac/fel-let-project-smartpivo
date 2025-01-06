import time
from datetime import datetime
from typing import Optional

from sqlalchemy import and_
from sqlalchemy.orm import Session
import models


def create_user(db: Session, name: str):
    db_user = models.User(name=name)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def get_users(db: Session):
    return db.query(models.User).all()


def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()


def delete_user(db: Session, user_id: int):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if db_user:
        db.delete(db_user)
        db.commit()
    return db_user


def get_beer_records(db: Session, user_id: int):
    return db.query(models.BeerRecord).filter(models.BeerRecord.user_id == user_id).all()


def get_latest_beer_records(db: Session, user_id: int):
    five_seconds_ago = int(time.time()) - 5
    return (db.query(models.BeerRecord)
            .filter(and_(
        models.BeerRecord.user_id == user_id,
        models.BeerRecord.timestamp >= five_seconds_ago))
            .all())


def create_beer_record(db: Session, user_id: int, weight: Optional[int]):
    db_beer_record = models.BeerRecord(user_id=user_id, weight=weight, timestamp=int(datetime.now().timestamp()))
    db.add(db_beer_record)
    db.commit()
    db.refresh(db_beer_record)
    return db_beer_record


def get_alcohol_records(db: Session, user_id: int):
    return db.query(models.AlcoholRecord).filter(models.AlcoholRecord.user_id == user_id).all()


def get_latest_alcohol_records(db: Session, user_id: int):
    five_seconds_ago = int(time.time()) - 5
    return (db.query(models.AlcoholRecord)
            .filter(and_(
        models.AlcoholRecord.user_id == user_id,
        models.AlcoholRecord.timestamp >= five_seconds_ago))
            .all())


def create_alcohol_record(db: Session, user_id: int, alcohol: Optional[int]):
    db_alcohol_record = models.AlcoholRecord(user_id=user_id, alcohol=alcohol, timestamp=int(datetime.now().timestamp()))
    db.add(db_alcohol_record)
    db.commit()
    db.refresh(db_alcohol_record)
    return db_alcohol_record
