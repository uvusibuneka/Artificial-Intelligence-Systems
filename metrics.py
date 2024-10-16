from abc import ABC, abstractmethod
import numpy as np
import pandas as pd

class Metric(ABC):
    @abstractmethod
    def loss(self, y: pd.Series, y_pred: pd.Series) -> float:
        pass

    @abstractmethod
    def gradient(self, df: pd.DataFrame, y: pd.Series, y_pred: pd.Series) -> np.ndarray:
        pass



