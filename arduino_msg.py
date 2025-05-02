import serial
import time

def send_to_arduino(message, port, baud_rate=9600):
    """
    Send a text message to Arduino via serial connection
    
    Args:
        message: The text to send
        port: Serial port the Arduino is connected to (e.g., 'COM3' on Windows, '/dev/ttyUSB0' on Linux)
        baud_rate: Baud rate, must match the rate set in Arduino code
    """
    try:
        # Open serial connection
        arduino = serial.Serial(port, baud_rate, timeout=1)
        print(f"Connected to Arduino on {port}")
        
        # Arduino may reset when the serial connection is established
        # Give it time to restart and run setup()
        time.sleep(2)
        
        # Ensure message ends with a newline to signal to Arduino it's complete
        if not message.endswith('\n'):
            message += '\n'
        
        # Send the message as bytes
        arduino.write(message.encode())
        print(f"Sent: {message.strip()}")
        
        # Wait a moment to ensure data is transmitted
        time.sleep(0.1)
        
        # Read any response from Arduino (optional)
        response = arduino.readline().decode().strip()
        if response:
            print(f"Arduino response: {response}")
        
        # Close the connection
        arduino.close()
        print("Connection closed")
        
    except serial.SerialException as e:
        print(f"Error: {e}")
        print("Common issues:")
        print("- Arduino not connected")
        print("- Wrong port specified")
        print("- Port already in use (Arduino IDE Serial Monitor open?)")

if __name__ == "__main__":
    # Example usage
    PORT = "/dev/ttyACM0"  # Change this to your Arduino's port
    
    # Single message example
    message = "Hello from Python!"
    send_to_arduino(message, PORT)
    
    # If you want to continuously send data:
    """
    while True:
        message = input("Enter message to send to Arduino (or 'exit' to quit): ")
        if message.lower() == 'exit':
            break
        send_to_arduino(message, PORT)
    """
    
    # Or integrate with your data collection code:
    """
    def collect_data():
        # Your data collection logic here
        return "Data: " + str(time.time())
    
    while True:
        message = collect_data()
        send_to_arduino(message, PORT)
        time.sleep(5)  # Wait 5 seconds between readings
    """
