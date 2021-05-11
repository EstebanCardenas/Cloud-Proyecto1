import os
# mongo
import pymongo
# dotenv
from dotenv import load_dotenv, find_dotenv
load_dotenv(find_dotenv())


uri = os.environ.get('DATABASE_URI')
client = pymongo.MongoClient(uri)
mongo_db = client.cloud
