import asyncio
from collections import deque
from multiprocessing import Value
from typing import Optional

import RPi.GPIO as GPIO
import serial
from RPLCD.i2c import CharLCD
from sqlalchemy.orm import Session

from crud import create_beer_record, get_user
from database import SessionLocal
from hx711v0_5_1 import HX711
from models import User

ser: Optional[serial.Serial] = None
lcd: Optional[CharLCD] = None
weight_sensor: Optional[HX711] = None
led_pin: Optional[int] = None
db: Optional[Session] = None


def main(active_user_id: Value):
    try:
        init()
        asyncio.run(event_loop(active_user_id))
    except KeyboardInterrupt:
        print("Keyboard interrupt.")
    finally:
        ser.close()
        lcd.close()
        GPIO.cleanup()
        db.close()


def init():
    global ser, lcd, weight_sensor, led_pin, db
    ser = serial.Serial(
        port='/dev/ttyUSB0',
        baudrate=9600,
        timeout=1,
    )

    lcd = CharLCD(
        i2c_expander='PCF8574',
        address=0x3f,
        port=1,
        cols=16,
        rows=2,
        charmap='A02',
        auto_linebreaks=True,
        backlight_enabled=True
    )

    weight_sensor = HX711(17, 27)
    weight_sensor.autosetOffset()
    reference_unit = -352000.77777777775 / 500
    weight_sensor.setReferenceUnit(reference_unit)

    GPIO.setmode(GPIO.BCM)
    led_pin = 14
    GPIO.setup(led_pin, GPIO.OUT)

    db = SessionLocal()


async def event_loop(active_user_id: Value):
    await asyncio.gather(
        read_weight(active_user_id),
        read_alcohol(),
        blink_led(),
    )


async def read_weight(active_user_id: Value):
    user: Optional[User] = None
    last_weights = deque(maxlen=3)
    last_weight_valid = False

    while True:
        if active_user_id.value > 0:
            if user is None or user.id != active_user_id.value:
                user = get_user(db, active_user_id.value)
            weight = weight_sensor.getWeight(channel='A')
            weight_rounded = int(round(weight, 0))
            last_weights.append(weight_rounded)

            lcd.clear()
            lcd.write_string(user.name)
            lcd.crlf()
            lcd.write_string(f"{weight_rounded} g")

            if weight_rounded > 10:
                last_weights_mean = sum(last_weights) / len(last_weights)
                ratio = last_weights_mean / weight_rounded
                ratio_acceptable = 0.8 < ratio < 1.2
                if ratio_acceptable:
                    create_beer_record(db, active_user_id.value, weight_rounded)
                    last_weight_valid = True

            else:
                if last_weight_valid:
                    create_beer_record(db, active_user_id.value, None)
                last_weight_valid = False
        else:
            lcd.clear()
            lcd.write_string('Cekam na')
            lcd.crlf()
            lcd.write_string("vyber uzivatele")

        await asyncio.sleep(1)


async def read_alcohol():
    while True:
        if ser.in_waiting > 0:
            alcohol = ser.readline().decode('utf-8').rstrip()
            break


async def blink_led():
    led = False
    while True:
        if led is False:
            GPIO.output(led_pin, GPIO.HIGH)
            led = True
        else:
            GPIO.output(led_pin, GPIO.LOW)
            led = False
        await asyncio.sleep(1)


if __name__ == "__main__":
    main(Value("i", -1))
