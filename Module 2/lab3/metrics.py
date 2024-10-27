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
        err = y - y_pred
        return 2 * np.array(X.T).dot(err)
    

class MAE(Metric):
    def loss(self, y: pd.Series, y_pred: pd.Series) -> float:
        return np.mean(abs(y - y_pred))
    
    def gradient(self, X: pd.DataFrame, y: pd.Series, y_pred: pd.Series)-> np.ndarray:
        err = y - y_pred
        return np.array(X.T).dot(np.sign(err))

class reg_MSE_L1(MSE):
    def __init__(self, reg_coef: float, weights: np.ndarray):
        super().__init__()
        self.reg_coef = reg_coef
        self.weights = weights

    def loss(self, y: pd.Series, y_pred: pd.Series) -> float:
        return super().loss(y, y_pred) + self.reg_coef * np.sum(np.abs(self.weights))
    
    def gradient(self, X, y, y_pred):
        return super().gradient(X, y, y_pred) + self.reg_coef * np.sign(self.weights)

class reg_MSE_L2(MSE):
    def __init__(self, reg_coef: float, weights: np.ndarray):
        super().__init__()
        self.reg_coef = reg_coef
        self.weights = weights

    def loss(self, y: pd.Series, y_pred: pd.Series) -> float:
        return super().loss(y, y_pred) + self.reg_coef * np.sum(self.weights ** 2)
    
    def gradient(self, X, y, y_pred):
        return super().gradient(X, y, y_pred) + 2 * self.reg_coef * self.weights

class reg_MAE_L1(MAE):
    def __init__(self, reg_coef: float, weights: np.ndarray):
        super().__init__()
        self.reg_coef = reg_coef
        self.weights = weights

    def loss(self, y: pd.Series, y_pred: pd.Series) -> float:
        return super().loss(y, y_pred) + self.reg_coef * np.sum(np.abs(self.weights))
    
    def gradient(self, X, y, y_pred):
        return super().gradient(X, y, y_pred) + self.reg_coef * np.sign(self.weights)

    


    

