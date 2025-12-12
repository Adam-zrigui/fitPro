export function formatDate(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

export function calculateBMI(weight: number, height: number): number {
  return Math.round((weight / Math.pow(height / 100, 2)) * 10) / 10
}

export function calculateCalories(
  weight: number,
  height: number,
  age: number,
  gender: 'male' | 'female',
  activityLevel: number
): number {
  let bmr: number
  if (gender === 'male') {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161
  }
  return Math.round(bmr * activityLevel)
}

export function calculateMacros(calories: number, goal: 'cut' | 'maintain' | 'bulk') {
  const proteinRatio = goal === 'cut' ? 0.35 : goal === 'bulk' ? 0.25 : 0.30
  const fatRatio = 0.25
  const carbRatio = 1 - proteinRatio - fatRatio

  return {
    protein: Math.round((calories * proteinRatio) / 4),
    carbs: Math.round((calories * carbRatio) / 4),
    fats: Math.round((calories * fatRatio) / 9),
  }
}

export function classNames(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(' ')
}
