"""extend_user_model_security_fields

Revision ID: d679adc11e37
Revises: a9302430bb0e
Create Date: 2026-07-17 19:27:22.195465

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import app.db.models


# revision identifiers, used by Alembic.
revision: str = 'd679adc11e37'
down_revision: Union[str, Sequence[str], None] = 'a9302430bb0e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add columns to users table
    op.add_column('users', sa.Column('is_active', sa.Boolean(), nullable=True, server_default=sa.text('1')))
    op.add_column('users', sa.Column('is_verified', sa.Boolean(), nullable=True, server_default=sa.text('0')))
    op.add_column('users', sa.Column('last_login', sa.DateTime(), nullable=True))
    op.add_column('users', sa.Column('updated_at', sa.DateTime(), nullable=True))

    # Add columns to incidents table
    op.add_column('incidents', sa.Column('zone_id', app.db.models.GUID(), nullable=True))
    op.add_column('incidents', sa.Column('resolved_at', sa.DateTime(), nullable=True))


def downgrade() -> None:
    op.drop_column('incidents', 'resolved_at')
    op.drop_column('incidents', 'zone_id')
    op.drop_column('users', 'updated_at')
    op.drop_column('users', 'last_login')
    op.drop_column('users', 'is_verified')
    op.drop_column('users', 'is_active')
