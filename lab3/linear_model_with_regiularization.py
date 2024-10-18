from linear_model import *
from metrics import *

class regularization_linear_model(ABC, linear_model):
    def __init__(self, df, metric, reg_coef):
        super().__init__(df, metric)
        self.reg_coef = reg_coef

    