import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database.connection import engine, Base
# Import all models so metadata knows about them
import app.database.models

print("Creating new tables...")
Base.metadata.create_all(bind=engine)
print("Done.")
