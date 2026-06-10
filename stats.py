import time
import requests
import psutil
import os

# Configuration: Update this with your dashboard server URL (e.g. your hosted domain)
SERVER_URL = "http://192.168.71.1:3000/api/telemetry"

def get_cpu_temp():
    # Attempt to read Raspberry Pi CPU temperature directly from system files
    try:
        if os.path.exists("/sys/class/thermal/thermal_zone0/temp"):
            with open("/sys/class/thermal/thermal_zone0/temp", "r") as f:
                temp_raw = f.read()
            return float(temp_raw) / 1000.0
    except Exception:
        pass
    
    # Fallback to check psutil sensors
    try:
        if hasattr(psutil, "sensors_temperatures"):
            temps = psutil.sensors_temperatures()
            if temps:
                for name, entries in temps.items():
                    for entry in entries:
                        if "cpu" in entry.label.lower() or name.lower() in ["cpu-thermal", "coretemp"]:
                            return entry.current
    except Exception:
        pass
    
    # Return a default mock temperature if cannot read (e.g. running on Windows for testing)
    return 45.2

def get_uptime():
    try:
        # Read from proc files on Linux systems
        if os.path.exists("/proc/uptime"):
            with open("/proc/uptime", "r") as f:
                uptime_seconds = float(f.readline().split()[0])
            
            days = int(uptime_seconds // (24 * 3600))
            hours = int((uptime_seconds % (24 * 3600)) // 3600)
            minutes = int((uptime_seconds % 3600) // 60)
            
            parts = []
            if days > 0:
                parts.append(f"{days}d")
            if hours > 0:
                parts.append(f"{hours}h")
            parts.append(f"{minutes}m")
            return ", ".join(parts)
    except Exception:
        pass

    # Generic boot time fallback
    try:
        uptime_seconds = time.time() - psutil.boot_time()
        days = int(uptime_seconds // (24 * 3600))
        hours = int((uptime_seconds % (24 * 3600)) // 3600)
        minutes = int((uptime_seconds % 3600) // 60)
        parts = []
        if days > 0:
            parts.append(f"{days}d")
        if hours > 0:
            parts.append(f"{hours}h")
        parts.append(f"{minutes}m")
        return ", ".join(parts)
    except Exception:
        return "Unknown"

def main():
    print("Gathering Home Server System Statistics...")
    
    # Gather metrics (measuring CPU load over 1 second)
    cpu_usage = psutil.cpu_percent(interval=1)
    memory_usage = psutil.virtual_memory().percent
    disk_usage = psutil.disk_usage('/').percent
    temperature = get_cpu_temp()
    uptime = get_uptime()

    payload = {
        "cpu_usage": cpu_usage,
        "memory_usage": memory_usage,
        "disk_usage": disk_usage,
        "temperature": round(temperature, 1),
        "uptime": uptime
    }

    print(f"Collected Metrics: {payload}")
    print(f"Sending to: {SERVER_URL}")
    
    try:
        response = requests.post(SERVER_URL, json=payload, timeout=10)
        if response.status_code == 200:
            print("Telemetry successfully reported to dashboard!")
        else:
            print(f"Server rejected telemetry. Status: {response.status_code}, Response: {response.text}")
    except Exception as e:
        print(f"Failed to connect to dashboard server: {e}")

if __name__ == "__main__":
    main()
# End of stats.py