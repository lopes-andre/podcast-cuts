"""Pytest configuration and fixtures."""
import pytest


@pytest.fixture
def mock_supabase():
    """Mock Supabase client."""
    from unittest.mock import Mock
    return Mock()

