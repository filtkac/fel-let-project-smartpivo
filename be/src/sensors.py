import asyncio
from collections import deque
from multiprocessing import Value
from typing import Optional

import RPi.GPIO as GPIO
import aioserial
from RPLCD.i2c import CharLCD
from sqlalchemy.orm import Session

from crud import create_beer_record, get_user, create_alcohol_record
from database import SessionLocal
from hx711v0_5_1 import HX711
from models import User

ser: Optional[aioserial.AioSerial] = None
lcd: Optional[CharLCD] = None
weight_sensor: Optional[HX711] = None
led_pin: Optional[int] = None
button_pin: Optional[int] = None
db: Optional[Session] = None

breath_test_timer = 0
weight_rounded = 0


def main(active_user_id: Value, breath_test_status: Value, stop_flag: Value):
    try:
        init()
        asyncio.run(event_loop(active_user_id, breath_test_status, stop_flag))
    except KeyboardInterrupt:
        print("Keyboard interrupt.")
    finally:
        ser.close()
        lcd.close()
        GPIO.cleanup()
        db.close()


def init():
    global ser, lcd, weight_sensor, led_pin, button_pin, db
    ser = aioserial.AioSerial(
        port='/dev/ttyUSB0',
        baudrate=9600,
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
    button_pin = 15
    GPIO.setup(button_pin, GPIO.IN, pull_up_down=GPIO.PUD_UP)

    db = SessionLocal()


async def event_loop(active_user_id: Value, breath_test_status: Value, stop_flag: Value):
    await asyncio.gather(
        read_weight(active_user_id),
        read_alcohol(active_user_id, breath_test_status),
        control_led(breath_test_status),
        handle_display(active_user_id, breath_test_status),
        handle_timer(active_user_id, breath_test_status),
        handle_stop(stop_flag)
    )


async def read_weight(active_user_id: Value):
    global weight_rounded
    last_weights = deque(maxlen=3)
    last_weight_valid = False

    while True:
        if active_user_id.value > 0:
            weight = weight_sensor.getWeight(channel='A')
            weight_rounded = int(round(weight, 0))
            last_weights.append(weight_rounded)

            if weight_rounded > 10:
                last_weights_mean = sum(last_weights) / len(last_weights)
                ratio = last_weights_mean / weight_rounded
                ratio_acceptable = 0.9 < ratio < 1.1
                if ratio_acceptable:
                    create_beer_record(db, active_user_id.value, weight_rounded)
                    last_weight_valid = True

            else:
                if last_weight_valid:
                    create_beer_record(db, active_user_id.value, None)
                last_weight_valid = False

        await asyncio.sleep(1)


async def read_alcohol(active_user_id: Value, breath_test_status: Value):
    while True:
        alcohol = (await ser.readline_async()).decode('utf-8').rstrip()
        if breath_test_status.value == 2 and active_user_id.value > 0:
            create_alcohol_record(db, active_user_id.value, int(alcohol))


async def control_led(breath_test_status: Value):
    while True:
        if breath_test_status.value != 0:
            GPIO.output(led_pin, GPIO.HIGH)
        else:
            GPIO.output(led_pin, GPIO.LOW)
        await asyncio.sleep(0.2)


async def handle_display(active_user_id: Value, breath_test_status: Value):
    global weight_rounded, breath_test_timer
    user: Optional[User] = None

    while True:
        if breath_test_status.value == 1:
            lcd.clear()
            lcd.write_string("Dechova zkouska")
            lcd.crlf()
            lcd.write_string("Potvrd tlacitkem")

        elif breath_test_status.value == 2:
            lcd.clear()
            lcd.write_string("Dychej!")
            lcd.crlf()
            lcd.write_string(f"{breath_test_timer}")

        elif active_user_id.value > 0:
            if user is None or user.id != active_user_id.value:
                user = get_user(db, active_user_id.value)

            lcd.clear()
            lcd.write_string(user.name)
            lcd.crlf()
            lcd.write_string(f"{weight_rounded} g")

        else:
            lcd.clear()
            lcd.write_string('Cekam na')
            lcd.crlf()
            lcd.write_string("vyber uzivatele")

        await asyncio.sleep(0.2)
        continue


async def handle_timer(active_user_id: Value, breath_test_status: Value):
    global breath_test_timer

    while True:
        if breath_test_status.value == 1 and GPIO.input(button_pin) == GPIO.LOW:
            await asyncio.sleep(0.05)  # debounce
            if GPIO.input(button_pin) == GPIO.LOW:
                breath_test_status.value = 2
                breath_test_timer = 10

                while breath_test_timer > 0:
                    breath_test_timer -= 1
                    await asyncio.sleep(1)

                breath_test_timer = 0
                breath_test_status.value = 0
                create_alcohol_record(db, active_user_id.value, None)

        await asyncio.sleep(0.1)


async def handle_stop(stop_flag: Value):
    while True:
        if stop_flag.value:
            asyncio.get_event_loop().stop()
        await asyncio.sleep(0.1)


if __name__ == "__main__":
    main(Value("i", -1), Value("i", 0), Value("b", False))
