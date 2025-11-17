import "../../styles/ui/stepIndicator.css";

function StepIndicator({ currentStep, totalSteps }) {
  return (
    <div className="step-indicator">
      <p className="step-indicator__label">
        Step {currentStep} of {totalSteps}
      </p>
      <div className="step-indicator__bars">
        {Array.from({ length: totalSteps }).map((_, index) => (
          <div
            key={index}
            className={`step-indicator__bar${
              index < currentStep ? " step-indicator__bar--active" : ""
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export default StepIndicator;
