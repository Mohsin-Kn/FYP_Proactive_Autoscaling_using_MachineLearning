import subprocess

# Run a Bash script and capture output/errors
result = subprocess.run(
    ["bash", "autoscaler-wrapper.sh"],  # Command + arguments
    capture_output=True,         # Capture stdout/stderr
    text=True,                   # Return output as string (not bytes)
    check=True                   # Raise error if script fails
)

print("Output:", result.stdout)
print("Errors:", result.stderr)
print("Exit Code:", result.returncode)