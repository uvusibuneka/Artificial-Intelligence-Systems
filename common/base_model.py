from abc import ABC, abstractmethod

class BaseModel(ABC):
    @abstractmethod
    def fit(self, X, y):
        """Train the model using the given data."""
        pass

    @abstractmethod
    def predict(self, X):
        """Make predictions using the trained model."""
        pass
