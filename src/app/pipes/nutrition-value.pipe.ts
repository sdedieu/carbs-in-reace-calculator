import { Pipe, PipeTransform } from "@angular/core";

export const formatNutritionValue = (value: number, unit = '', maximumFractionDigits = 0): string => {
    const formatted = new Intl.NumberFormat('en-US', {
        maximumFractionDigits,
        minimumFractionDigits: value > 0 && value < 1 ? 1 : 0,
    }).format(value);

    return unit ? `${formatted} ${unit}` : formatted;
};

@Pipe({
    name: 'nutritionValue',
    standalone: true,
})
export class NutritionValuePipe implements PipeTransform {
    transform(value: number, unit = '', maximumFractionDigits = 0): string {
        return formatNutritionValue(value, unit, maximumFractionDigits);
    }
}