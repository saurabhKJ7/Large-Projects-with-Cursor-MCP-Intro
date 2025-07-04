import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.database import Base, get_db
from app.models import User, APIKey
from app.auth import create_api_key
import os
from datetime import datetime, timedelta

# Test database URL
TEST_DATABASE_URL = "sqlite:///./test.db"

# Create test database engine
engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture
def test_db():
    # Create test database tables
    Base.metadata.create_all(bind=engine)
    try:
        yield TestingSessionLocal()
    finally:
        Base.metadata.drop_all(bind=engine)

@pytest.fixture
def client(test_db):
    def override_get_db():
        try:
            yield test_db
        finally:
            test_db.close()
    
    app.dependency_overrides[get_db] = override_get_db
    return TestClient(app)

@pytest.fixture
def test_user(test_db):
    user = User(
        username="testuser",
        email="test@example.com",
        hashed_password="testpass"
    )
    test_db.add(user)
    test_db.commit()
    test_db.refresh(user)
    return user

@pytest.fixture
def test_api_key(test_db, test_user):
    api_key = create_api_key(
        db=test_db,
        user_id=test_user.id,
        permissions=["read", "write"]
    )
    return api_key

def test_send_message(client, test_api_key):
    response = client.post(
        "/discord/send_message",
        json={"channel_id": 123456789, "content": "Test message"},
        headers={"X-API-Key": test_api_key}
    )
    assert response.status_code == 200
    data = response.json()
    assert "message_id" in data
    assert data["content"] == "Test message"

def test_get_messages(client, test_api_key):
    response = client.get(
        "/discord/get_messages?channel_id=123456789&limit=10",
        headers={"X-API-Key": test_api_key}
    )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

def test_get_channel_info(client, test_api_key):
    response = client.get(
        "/discord/get_channel_info?channel_id=123456789",
        headers={"X-API-Key": test_api_key}
    )
    assert response.status_code == 200
    data = response.json()
    assert "id" in data
    assert "name" in data

def test_search_messages(client, test_api_key):
    response = client.post(
        "/discord/search_messages",
        json={"channel_id": 123456789, "query": "test", "limit": 10},
        headers={"X-API-Key": test_api_key}
    )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

def test_moderate_content(client, test_api_key):
    response = client.delete(
        "/discord/moderate_content",
        json={
            "message_id": 123456789,
            "channel_id": 123456789,
            "action": "delete",
            "reason": "Test moderation"
        },
        headers={"X-API-Key": test_api_key}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["action"] == "delete"

def test_invalid_api_key(client):
    response = client.get(
        "/discord/get_messages?channel_id=123456789",
        headers={"X-API-Key": "invalid_key"}
    )
    assert response.status_code == 401

def test_expired_api_key(client, test_db, test_user):
    # Create expired API key
    expired_key = create_api_key(
        db=test_db,
        user_id=test_user.id,
        permissions=["read"]
    )
    api_key = test_db.query(APIKey).filter(APIKey.key_hash == expired_key).first()
    api_key.expires_at = datetime.utcnow() - timedelta(days=1)
    test_db.commit()

    response = client.get(
        "/discord/get_messages?channel_id=123456789",
        headers={"X-API-Key": expired_key}
    )
    assert response.status_code == 401

def test_insufficient_permissions(client, test_db, test_user):
    # Create API key with read-only permissions
    read_only_key = create_api_key(
        db=test_db,
        user_id=test_user.id,
        permissions=["read"]
    )

    response = client.post(
        "/discord/send_message",
        json={"channel_id": 123456789, "content": "Test message"},
        headers={"X-API-Key": read_only_key}
    )
    assert response.status_code == 403