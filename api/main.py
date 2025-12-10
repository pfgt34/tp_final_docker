import os
import psycopg2
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI()

DB_HOST = os.getenv('DB_HOST', 'db')
DB_PORT = int(os.getenv('DB_PORT', '5432'))
DB_USER = os.getenv('DB_USER', 'postgres')
DB_PASSWORD = os.getenv('DB_PASSWORD', '')
DB_NAME = os.getenv('DB_NAME', 'itemsdb')


def get_conn():
    try:
        conn = psycopg2.connect(host=DB_HOST, port=DB_PORT, user=DB_USER, password=DB_PASSWORD, dbname=DB_NAME)
        return conn
    except Exception as e:
        raise


@app.get('/status')
def status():
    return {"status": "OK"}


class Item(BaseModel):
    id: int
    name: str
    description: str | None = None


@app.get('/items')
def items():
    try:
        conn = get_conn()
        cur = conn.cursor()
        cur.execute('SELECT id, name, description FROM items ORDER BY id;')
        rows = cur.fetchall()
        cur.close()
        conn.close()
        result = [ { 'id': r[0], 'name': r[1], 'description': r[2] } for r in rows ]
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == '__main__':
    import uvicorn
    uvicorn.run('main:app', host='0.0.0.0', port=int(os.getenv('PORT', '8000')))
