import json, pathlib

S = {"Languages": ["Python", "C", "Java", "SQL", "JavaScript"],
     "AI / ML": ["Machine Learning", "NumPy", "Pandas", "scikit-learn"],
     "Core CS": ["DSA", "DBMS", "OS", "Computer Organization"],
     "Tools": ["Git & GitHub", "VS Code", "Jupyter", "Linux"],
     "People": ["Problem Solving", "Teamwork", "Communication"]}
I = ["AI", "Coding", "Open Source", "Hackathons", "Gaming", "Music", "Cricket", "Photography"]
p = pathlib.Path(__file__).parent.parent / "assets" / "data.json"
p.write_text(json.dumps({"skills": S, "interests": I}, indent=1))
