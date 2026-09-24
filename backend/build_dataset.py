"""
build_dataset.py
----------------
Builds the project dataset (backend/data/diabetes_health.csv) from the public
CDC NHANES 2013-2014 survey files.

Six health factors required by the project specification are extracted:
    age, bmi, physical_activity, blood_pressure, cholesterol, glucose

Target:
    diabetes = 1 if the respondent has been diagnosed with diabetes by a
               doctor (NHANES DIQ010 == 1), else 0.

Source files (downloaded automatically):
    DEMO_H  - demographics       (RIDAGEYR)
    BMX_H   - body measures      (BMXBMI)
    BPX_H   - blood pressure     (BPXSY1..BPXSY4)
    TCHOL_H - total cholesterol  (LBXTC)
    GLU_H   - fasting glucose    (LBXGLU)
    PAQ_H   - physical activity  (PAQ650 / PAQ665)
    DIQ_H   - diabetes status    (DIQ010)

Run:  python backend/build_dataset.py
"""

import os
import urllib.request

import pandas as pd

BASE = "https://wwwn.cdc.gov/Nchs/Data/Nhanes/Public/2013/DataFiles"
FILES = ["DEMO_H", "BMX_H", "BPX_H", "GLU_H", "TCHOL_H", "PAQ_H", "DIQ_H"]

HERE = os.path.dirname(os.path.abspath(__file__))
RAW_DIR = os.path.join(HERE, "data", "raw")
OUT_CSV = os.path.join(HERE, "data", "diabetes_health.csv")


def download() -> None:
    os.makedirs(RAW_DIR, exist_ok=True)
    for name in FILES:
        path = os.path.join(RAW_DIR, f"{name}.xpt")
        if not os.path.exists(path):
            print(f"downloading {name}.xpt ...")
            urllib.request.urlretrieve(f"{BASE}/{name}.xpt", path)


def read(name: str) -> pd.DataFrame:
    return pd.read_sas(os.path.join(RAW_DIR, f"{name}.xpt"), format="xport")


def build() -> pd.DataFrame:
    demo = read("DEMO_H")[["SEQN", "RIDAGEYR"]]
    bmx = read("BMX_H")[["SEQN", "BMXBMI"]]
    bpx = read("BPX_H")[["SEQN", "BPXSY1", "BPXSY2", "BPXSY3", "BPXSY4"]]
    tchol = read("TCHOL_H")[["SEQN", "LBXTC"]]
    glu = read("GLU_H")[["SEQN", "LBXGLU"]]
    paq = read("PAQ_H")[["SEQN", "PAQ650", "PAQ665"]]
    diq = read("DIQ_H")[["SEQN", "DIQ010"]]

    # average of the available systolic readings
    bpx["blood_pressure"] = bpx[["BPXSY1", "BPXSY2", "BPXSY3", "BPXSY4"]].mean(axis=1)
    bpx = bpx[["SEQN", "blood_pressure"]]

    df = demo
    for part in (bmx, bpx, tchol, glu, paq, diq):
        df = df.merge(part, on="SEQN", how="left")

    # adults only (diabetes questionnaire is asked from age 20 upward)
    df = df[df["RIDAGEYR"] >= 20]

    # physical activity level derived from recreational activity questions
    def activity(row):
        if row.get("PAQ650") == 1:
            return "High"
        if row.get("PAQ665") == 1:
            return "Moderate"
        if row.get("PAQ650") == 2 or row.get("PAQ665") == 2:
            return "Low"
        return None

    df["physical_activity"] = df.apply(activity, axis=1)

    # target: doctor-diagnosed diabetes (1 = yes, 2 = no, 3 = borderline)
    df = df[df["DIQ010"].isin([1, 2])]
    df["diabetes"] = (df["DIQ010"] == 1).astype(int)

    out = df.rename(
        columns={"RIDAGEYR": "age", "BMXBMI": "bmi", "LBXTC": "cholesterol", "LBXGLU": "glucose"}
    )[
        [
            "age",
            "bmi",
            "physical_activity",
            "blood_pressure",
            "cholesterol",
            "glucose",
            "diabetes",
        ]
    ]

    # a record is kept when the target and at least the core measurements exist;
    # remaining gaps (BMI / glucose / cholesterol) are imputed in train_model.py
    out = out.dropna(subset=["glucose"])
    out = out[out["physical_activity"].notna()]
    return out.round(2).reset_index(drop=True)


if __name__ == "__main__":
    download()
    data = build()
    os.makedirs(os.path.dirname(OUT_CSV), exist_ok=True)
    data.to_csv(OUT_CSV, index=False)
    print(f"rows={len(data)}  positives={int(data['diabetes'].sum())}")
    print(data.head())
    print(data.isna().sum())
