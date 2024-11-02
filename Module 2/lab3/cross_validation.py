from linear_model import *
import pandas as pd
import math

class cross_validation:
    def __init__(self, df: pd.DataFrame, target_name: str, error: Error, k: int):
        self.df = df
        self.k = k
        self.models = []
        self.error = error
        self.test_df = None
        self.best_model = None 
        self.target_name = target_name

    def split_df(self):
        splits = self._split()
        for split in splits:
            self.models.append(linear_model(split, self.error))
            self.models[-1].X_train = split.drop(self.target_name, axis=1)
            self.models[-1].y_train = split[self.target_name]
            self.models[-1].X_test = self.test_df.drop(self.target_name, axis=1)
            self.models[-1].y_test = self.test_df[self.target_name]
            self.models[-1].shuffle_df()

    def _split(self)-> np.array:
        self.df = self.df.sample(frac=1).reset_index(drop=True)
        valid_df = np.array_split(self.df, self.k + 1)
        self.test_df = valid_df[0]
        return valid_df[1:]


    def fit(self, epochs: int, lr=0.000001):
        for model in self.models:
            model.fit(epochs, lr)
        self.best_model = min(self.models, key=lambda x: (0.5 - x.coef_determination())**2)

    def predict(self, x: pd.DataFrame) -> pd.Series:
        return self.best_model.predict(x)
    
    def coef_determination(self):
        return self.best_model.coef_determination()
        
        
