import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, StaticPool
from sqlalchemy.orm import sessionmaker

import sys
import os

# Add the backend directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app
from app.database.connection import get_db, Base
from app.database.models import User, AuthorizedDomain, ApprovedRoster
from app.auth.security import get_password_hash

# Setup test database
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db_session():
    # Create the database tables
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    
    # Add initial authorized domain for testing
    domain = AuthorizedDomain(domain="klaso.edu", is_active=True)
    session.add(domain)
    
    # Add roster entries
    student_roster = ApprovedRoster(
        email="teststudent@klaso.edu",
        reg_no="STU001",
        role="student",
        full_name="Test Student",
        department="Computer Science",
        year="3rd Year",
        section="Section A"
    )
    faculty_roster = ApprovedRoster(
        email="testfaculty@klaso.edu",
        reg_no="FAC001",
        role="faculty",
        full_name="Test Faculty",
        department="Computer Science",
        designation="Professor"
    )
    admin_roster = ApprovedRoster(
        email="admin@klaso.edu",
        reg_no="ADM001",
        role="admin",
        full_name="System Admin",
        department="Administration",
        is_registered=True
    )
    
    # Admin User
    admin_user = User(
        email="admin@klaso.edu",
        password_hash=get_password_hash("adminpass"),
        role="admin",
        full_name="System Admin",
        reg_no="ADM001",
        is_active=True
    )
    
    student_user = User(
        email="teststudent@klaso.edu",
        password_hash=get_password_hash("pass"),
        role="student",
        full_name="Test Student",
        reg_no="STU001",
        is_active=True
    )
    
    faculty_user = User(
        email="testfaculty@klaso.edu",
        password_hash=get_password_hash("pass"),
        role="faculty",
        full_name="Test Faculty",
        reg_no="FAC001",
        is_active=True
    )
    
    session.add_all([student_roster, faculty_roster, admin_roster, admin_user, student_user, faculty_user])
    session.commit()
    
    yield session
    
    session.close()
    # Drop all tables after test
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
