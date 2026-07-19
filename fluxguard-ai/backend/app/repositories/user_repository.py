from sqlalchemy.orm import Session

from app.db.models import User


class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_user_by_email(self, email: str) -> User | None:
        return self.db.query(User).filter(User.email == email).first()

    def add_user(self, user_data: dict) -> User:
        user = User(
            name=user_data["name"],
            email=user_data["email"],
            password_hash=user_data["password_hash"],
            role=user_data["role"],
            preferred_language=user_data.get("preferred_language", "en"),
        )
        self.db.add(user)
        self.db.commit()
        return user
