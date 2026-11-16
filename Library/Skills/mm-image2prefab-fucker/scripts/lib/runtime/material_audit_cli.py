import json
import sys
from material_audit import audit_material

request = json.load(sys.stdin)
print(json.dumps(audit_material(request['plan'], request['source'], request['project'], request['output']), ensure_ascii=False))
