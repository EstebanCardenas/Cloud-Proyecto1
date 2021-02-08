from flask import Flask, request, json
from flask_cors.extension import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_marshmallow import Marshmallow
#modelos
from models import *

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///test.db'
db = SQLAlchemy(app)
ma = Marshmallow(app)
CORS(app)

@app.route('/')
def hello_world():
    return 'Hello World!'

if __name__ == '__main__':
    app.run()
