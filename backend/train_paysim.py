"""PaySim-only entry point. See train_risk_models.py for the shared workflow."""

import sys

from train_risk_models import main


if __name__ == "__main__":
    sys.argv[1:1] = ["paysim"]
    main()
