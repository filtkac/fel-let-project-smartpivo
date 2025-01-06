from contextlib import asynccontextmanager
from multiprocessing import Process, Value

from fastapi import FastAPI
from fastapi.params import Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text

import database
import models
import crud
import sensors

models.Base.metadata.create_all(bind=database.engine)

active_user_id = Value("i", -1)
"""
0 = nothing
1 = waiting for confirmation
2 = measuring
"""
breath_test_status = Value("i", 0)
stop_flag = Value("b", False)


@asynccontextmanager
async def lifespan(app: FastAPI):
    global active_user_id, breath_test_status, stop_flag
    sensors_process = Process(target=sensors.main, args=(active_user_id, breath_test_status, stop_flag))
    sensors_process.start()
    yield

    stop_flag.value = True

    sensors_process.join()
    del active_user_id
    del breath_test_status
    del stop_flag


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return "Server home."


@app.post("/reset")
def reset(db: Session = Depends(database.get_db)):
    db.execute(text("delete from users"))
    db.execute(text("delete from beer_records"))
    db.execute(text("delete from alcohol_records"))
    db.commit()
    active_user_id.value = -1


@app.get("/users")
def get_users(db: Session = Depends(database.get_db)):
    return crud.get_users(db)


@app.post("/users")
def create_user(user: models.UserCreate, db: Session = Depends(database.get_db)):
    return crud.create_user(db, name=user.name)


@app.get("/users/active")
def get_active_user(db: Session = Depends(database.get_db)):
    return crud.get_user(db, user_id=active_user_id.value)


@app.post("/users/{user_id}/activate")
def activate_user(user_id: int, db: Session = Depends(database.get_db)):
    user = crud.get_user(db, user_id=user_id)
    if user:
        active_user_id.value = user.id
    return user


@app.get("/users/{user_id}/beer-records")
def get_beer_records(user_id: int, db: Session = Depends(database.get_db)):
    return crud.get_beer_records(db, user_id=user_id)


@app.get("/users/{user_id}/beer-records/latest")
def get_latest_beer_records(user_id: int, db: Session = Depends(database.get_db)):
    return crud.get_latest_beer_records(db, user_id=user_id)


@app.get("/users/{user_id}/alcohol-records")
def get_alcohol_records(user_id: int, db: Session = Depends(database.get_db)):
    return crud.get_alcohol_records(db, user_id=user_id)


@app.get("/users/{user_id}/alcohol-records/latest")
def get_latest_alcohol_records(user_id: int, db: Session = Depends(database.get_db)):
    return crud.get_latest_alcohol_records(db, user_id=user_id)


@app.post("/start-breath-test")
def start_breath_test():
    if breath_test_status.value != 0:
        return "Test ještě probíhá."
    breath_test_status.value = 1
    return ""
