"""
visualize.py
------------
Generates the evaluation and exploratory figures required by the project report:

    reports/confusion_matrix.png
    reports/roc_curve.png
    reports/feature_importance.png
    reports/class_distribution.png
    reports/feature_distributions.png
    reports/correlation_heatmap.png

Run after training:  python backend/visualize.py
"""

import json
import os

import joblib
import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402
import pandas as pd  # noqa: E402
import seaborn as sns  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
REPORTS = os.path.join(HERE, "reports")
MODELS = os.path.join(HERE, "models")
DATA = os.path.join(HERE, "data", "diabetes_health.csv")
NUMERIC = ["age", "bmi", "blood_pressure", "cholesterol", "glucose"]


def main() -> None:
    os.makedirs(REPORTS, exist_ok=True)
    df = pd.read_csv(DATA)
    with open(os.path.join(MODELS, "metrics.json")) as fh:
        metrics = json.load(fh)
    joblib.load(os.path.join(MODELS, "diabetes_model.pkl"))  # ensure the model exists

    sns.set_theme(style="whitegrid")

    cm = metrics["confusionMatrix"]
    matrix = [[cm["trueNegative"], cm["falsePositive"]], [cm["falseNegative"], cm["truePositive"]]]
    plt.figure(figsize=(4.5, 4))
    sns.heatmap(
        matrix,
        annot=True,
        fmt="d",
        cmap="Blues",
        xticklabels=["Non-Diabetic", "Diabetic"],
        yticklabels=["Non-Diabetic", "Diabetic"],
    )
    plt.title("Confusion Matrix")
    plt.xlabel("Predicted")
    plt.ylabel("Actual")
    plt.tight_layout()
    plt.savefig(os.path.join(REPORTS, "confusion_matrix.png"), dpi=150)
    plt.close()

    roc = pd.DataFrame(metrics["rocCurve"])
    plt.figure(figsize=(5, 4.5))
    plt.plot(roc["fpr"], roc["tpr"], label=f"ROC (AUC = {metrics['rocAuc']})")
    plt.plot([0, 1], [0, 1], "--", color="grey")
    plt.xlabel("False Positive Rate")
    plt.ylabel("True Positive Rate")
    plt.title("ROC Curve")
    plt.legend()
    plt.tight_layout()
    plt.savefig(os.path.join(REPORTS, "roc_curve.png"), dpi=150)
    plt.close()

    imp = pd.DataFrame(metrics["featureImportance"])
    plt.figure(figsize=(6, 4))
    sns.barplot(data=imp, y="feature", x="importance", color="#2a7f8f")
    plt.title("Random Forest Feature Importance")
    plt.tight_layout()
    plt.savefig(os.path.join(REPORTS, "feature_importance.png"), dpi=150)
    plt.close()

    plt.figure(figsize=(4.5, 4))
    sns.countplot(x=df["diabetes"].map({0: "Non-Diabetic", 1: "Diabetic"}), color="#2a7f8f")
    plt.title("Class Distribution")
    plt.xlabel("")
    plt.tight_layout()
    plt.savefig(os.path.join(REPORTS, "class_distribution.png"), dpi=150)
    plt.close()

    fig, axes = plt.subplots(2, 3, figsize=(14, 7))
    for ax, col in zip(axes.flatten(), NUMERIC):
        sns.histplot(data=df, x=col, hue="diabetes", kde=True, ax=ax, palette="viridis")
        ax.set_title(col.replace("_", " ").title())
    sns.countplot(data=df, x="physical_activity", hue="diabetes", ax=axes.flatten()[5], palette="viridis")
    axes.flatten()[5].set_title("Physical Activity")
    plt.tight_layout()
    plt.savefig(os.path.join(REPORTS, "feature_distributions.png"), dpi=150)
    plt.close()

    plt.figure(figsize=(6, 5))
    sns.heatmap(df[NUMERIC + ["diabetes"]].corr(), annot=True, fmt=".2f", cmap="coolwarm")
    plt.title("Correlation Heatmap")
    plt.tight_layout()
    plt.savefig(os.path.join(REPORTS, "correlation_heatmap.png"), dpi=150)
    plt.close()

    print(f"figures written to {REPORTS}")


if __name__ == "__main__":
    main()
