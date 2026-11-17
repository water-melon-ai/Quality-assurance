import gsap from 'gsap';

export function animateProgressBar(element: HTMLElement, progress: number, duration = 0.8) {
  gsap.to(element, {
    width: `${Math.min(100, Math.max(0, progress))}%`,
    duration,
    ease: 'power2.out',
  });
}

export function animateScoreRing(
  element: SVGElement,
  score: number,
  circumference: number,
  duration = 1.2
) {
  const offset = circumference - (Math.min(100, Math.max(0, score)) / 100) * circumference;
  gsap.to(element, {
    strokeDashoffset: offset,
    strokeDasharray: circumference,
    duration,
    ease: 'power2.out',
  });
}

export function counterAnimation(
  element: HTMLElement,
  targetValue: number,
  prefix = '',
  suffix = '',
  duration = 1.0
) {
  const currentText = element.innerText.replace(/[^0-9.-]/g, '');
  const startVal = parseFloat(currentText) || 0;
  const obj = { val: startVal };

  gsap.to(obj, {
    val: targetValue,
    duration,
    ease: 'power2.out',
    onUpdate: () => {
      element.innerText = `${prefix}${Math.round(obj.val)}${suffix}`;
    },
  });
}
