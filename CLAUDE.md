
---

# Port Management with Portman

This project uses **Portman** for centralized port management. When working with ports in this project, always use Portman to check and update port configurations.

## IMPORTANT: Port Configuration Check and Update

### 1. First, check the current Portman assignment for this project:

```bash
# Get the assigned port for this project
# For sub-projects, use parent/child format
PROJECT_NAME=$(basename "$PWD")
PARENT_DIR=$(basename "$(dirname "$PWD")")

# Check if this is a sub-project (e.g., in apis/, services/, apps/ directories)
if [[ "$PARENT_DIR" =~ ^(apis|services|apps|packages)$ ]]; then
    PROJECT_ID="$PARENT_DIR/$PROJECT_NAME"
else
    PROJECT_ID="$PROJECT_NAME"
fi

ASSIGNED_PORT=$(portman get "$PROJECT_ID" --json | jq -r .port)
echo "Portman assigned port for $PROJECT_ID: $ASSIGNED_PORT"
```

**Project Naming Convention:**
- **Regular projects**: Use project name directly (e.g., `ai-image-server`)
- **Sub-projects**: Use `parent/child` format (e.g., `apis/gateway-api`, `apis/weather-api`)
- **Common parent directories**: `apis/`, `services/`, `apps/`, `packages/`

This ensures unique identification for projects with similar names in different contexts.

### 2. Check if the project is using the correct port:

Search for hardcoded ports in the project and compare with Portman's assignment:
- `.env` files
- `docker-compose.yml` or `docker-compose.yaml`
- Configuration files (`.json`, `.yaml`, `.yml`)
- Source code files (`.js`, `.ts`, `.py`, `.go`, etc.)

### 3. Update ports if they don't match:

**If the project is using a different port than Portman's assignment:**

1. **Check for conflicts first:**
   ```bash
   # Check if the current port is already assigned to another project
   portman list --json | jq '.[] | select(.port == CURRENT_PORT_NUMBER)'
   ```

2. **If there's a conflict, consult with the user:**
   - "Project X is using port YYYY, but Portman has assigned port ZZZZ"
   - "Another project (NAME) is already using port YYYY"
   - Ask: "Should I update to use Portman's assigned port ZZZZ, or assign a different port?"

3. **Update all occurrences to use Portman's port:**
   - `.env`: `PORT=ZZZZ`
   - `docker-compose.yml`: Update all port mappings
   - Source code: Replace hardcoded port numbers
   - Configuration files: Update port settings

### 4. Common patterns to update:

#### .env files:
```bash
# Replace
PORT=3000
# With
PORT=$ASSIGNED_PORT
```

#### docker-compose.yml:
```yaml
# Replace
ports:
  - "3000:3000"
# With
ports:
  - "${PORT:-$ASSIGNED_PORT}:${PORT:-$ASSIGNED_PORT}"
```

#### Node.js code:
```javascript
// Replace
const PORT = process.env.PORT || 3000;
// With
const PORT = process.env.PORT || $ASSIGNED_PORT;
```

#### Package.json scripts:
```json
{
  "scripts": {
    "dev": "PORT=$(portman get \"$(basename $PWD)\" --json | jq -r .port) next dev",
    "start": "PORT=$(portman get \"$(basename $PWD)\" --json | jq -r .port) node server.js"
  }
}
```

## When to Take Action:

1. **Do nothing if:** The project is already using the port assigned by Portman
2. **Update all references if:** The project uses a different port than Portman's assignment
3. **Ask for guidance if:**
   - There's a port conflict with another project
   - The project needs multiple ports
   - The current port is in a reserved range (< 3000)
   - You're unsure about making changes

## New Port Assignment:

If the project doesn't have a Portman assignment yet:
1. First check what port the project is currently using
2. Determine the correct project ID using the naming convention
3. Ask the user: "This project uses port XXXX. Should I register it with Portman as '$PROJECT_ID'?"
4. If yes, use: `portman set "$PROJECT_ID" XXXX`
5. If the port is already taken, ask for an alternative

**Examples:**
```bash
# Regular project
portman set "ai-image-server" 3007

# Sub-project in apis directory
portman set "apis/gateway-api" 3040
portman set "apis/weather-api" 3043

# Sub-project in services directory
portman set "services/auth-service" 3050
```

## Dashboard

View all port assignments at: http://localhost:8081
```bash
portman dashboard
```

---
Remember: Always ensure the project uses the port assigned by Portman!

## Portman Port Management

This project uses Portman for port management. When assigning ports, use the following naming convention:

**Format**: `project-folder/identifier`

Examples:
- If this project is in `apis/apps/myapp`, use: `portman get "apis/myapp"`
- If this project is in `services/auth`, use: `portman get "services/auth"`
- For simple projects: `portman get "project-name"`

To get/assign a port for this project:
```bash
# Get the project folder structure
PROJECT_PATH=$(pwd | sed "s|^$HOME/projects/||")
PROJECT_NAME=$(basename "$PROJECT_PATH")

# For nested projects (e.g., apis/apps/something)
if [[ "$PROJECT_PATH" == *"apps/"* ]] || [[ "$PROJECT_PATH" == *"services/"* ]] || [[ "$PROJECT_PATH" == *"packages/"* ]]; then
    PARENT_FOLDER=$(echo "$PROJECT_PATH" | cut -d'/' -f1)
    PORTMAN_NAME="$PARENT_FOLDER/$PROJECT_NAME"
else
    PORTMAN_NAME="$PROJECT_NAME"
fi

# Get or assign port
PORT=$(portman get "$PORTMAN_NAME" --json | jq -r .port)
echo "Project '$PORTMAN_NAME' assigned port: $PORT"
```

