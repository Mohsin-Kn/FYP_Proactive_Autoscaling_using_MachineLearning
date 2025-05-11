# !/bin/bash
# autoscaler.sh

# # Configuration
# LOG_DIR="logs"
# mkdir -p $LOG_DIR

# # # Install dependencies if missing
# # if ! pip show kubernetes pandas tensorflow keras-tcn &> /dev/null; then
# #     echo "Installing required packages..."
# #     pip install kubernetes pandas tensorflow keras-tcn >> $LOG_DIR/install.log 2>&1
# # fi

# #!/bin/bash

# # Suppress TensorFlow warnings
# export TF_ENABLE_ONEDNN_OPTS=0
# export TF_CPP_MIN_LOG_LEVEL=2

# # Main loop
# while true; do
#     echo "=== Scaling check at $(date) ==="
#     python3 proactive_scaling.py
#     sleep 1200  # 20-minute intervals
# done

# # #!/bin/bash

# # # Initialize or reset processing index
# # echo "0" > last_index.txt

# # # Suppress TensorFlow warnings
# # export TF_ENABLE_ONEDNN_OPTS=0
# # export TF_CPP_MIN_LOG_LEVEL=2

# # # Main loop
# # while true; do
# #     echo "=== Scaling check at $(date) ==="
# #     python3 proactive_scaling.py
# #     sleep 1200  # 20-minute intervals
# # done

#!/bin/bash

# Initialize or reset processing index
echo "0" > last_index.txt

# Suppress warnings
export TF_ENABLE_ONEDNN_OPTS=0
export TF_CPP_MIN_LOG_LEVEL=2
export PYTHONWARNINGS="ignore"

# Main loop
while true; do
    echo "=== Scaling check at $(date) ==="
    python3 proactive_scaling.py
    sleep 5  # 20-minute intervals
done