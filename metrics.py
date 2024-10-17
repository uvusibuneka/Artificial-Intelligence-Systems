from abc import ABC, abstractmethod
import numpy as np
import pandas as pd

class Metric(ABC):
    @abstractmethod
    def loss(self, y: pd.Series, y_pred: pd.Series) -> float:
        pass

    @abstractmethod
    def gradient(self, X: pd.DataFrame, y: pd.Series, y_pred: pd.Series) -> np.ndarray:
        pass


class MSE(Metric):
    def loss(self, y: pd.Series, y_pred: pd.Series) -> float:
        return np.mean((y - y_pred) ** 2)
    
    def gradient(self, X: pd.DataFrame, y: pd.Series, y_pred: pd.Series) -> np.ndarray:
        err = y_pred - y
        return 2 * np.array(self.X.T).dot(err) / len(y)
    

class MAE(Metric):
    def loss(self, y: pd.Series, y_pred: pd.Series) -> float:
        return np.mean(abs(y - y_pred))
    
    def gradient(self, X: pd.DataFrame, y: pd.Series, y_pred: pd.Series) -> np.ndarray:
        err = y - y_pred
        return X.T.dot(np.sign(err)) / len(y)
    

class MPE(Metric):
    def loss(self, y: pd.Series, y_pred: pd.Series) -> float:
        return np.mean((y - y_pred)/y)
    
    def gradient(self, X: pd.DataFrame, y: pd.Series, y_pred: pd.Series) -> np.ndarray:
        err = (y - y_pred)/y
        return X.T.dot(err) / len(y)
    

