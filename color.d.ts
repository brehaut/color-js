// This typescript file provides ambient types for color.js. 
//
// Please consult that file for the implementation of the script.

declare module net.brehaut {
    export interface Color {
        // field accessors
        getRed(): number;
        setRed(newRed: number): Color;
        getGreen(): number;
        setGreen(newGreen: number): Color;
        getBlue(): number;
        setBlue(newBlue: number): Color;

        getHue(): number;
        setHue(newHue: number): Color;
        getSaturation(): number;
        setSaturation(newSaturation: number): Color;

        getValue(): number;
        setValue(newValue: number): Color;

        getLightness(): number;
        setLightness(newValue: number): Color;
        getLuminance(): number;
        getAlpha(): number;
        setAlpha(newAlpha: number): Color;

        // manipulation methods
        shiftHue(degrees: number): Color;

        darkenByAmount(amount: number): Color;
        darkenByRatio(ratio: number): Color;
        lightenByAmount(amount: number): Color;
        lightenByRatio(amount: number): Color;

        devalueByAmount(amount: number): Color;
        devalueByRatio(ratio: number): Color;
        valueByAmount(amount: number): Color;
        valueByRatio(amount: number): Color;

        desaturateByAmount(amount: number): Color;
        desaturateByRatio(ratio: number): Color;
        saturateByAmount(amount: number): Color;
        saturateByRatio(ratio: number ): Color;

        blend(color:Color, alpha:number): Color;

        // generating lists of colors
        schemeFromDegrees(listOfdegrees: number[]): Color[];

        complementaryScheme(): Color[];
        splitComplementaryScheme(): Color[];
        splitComplementaryCWScheme(): Color[];
        splitComplementaryCCWScheme(): Color[];
        triadicScheme(): Color[];
        clashScheme(): Color[];
        tetradicScheme(): Color[];
        fourToneCWScheme(): Color[];
        fourToneCCWScheme(): Color[];
        fiveToneAScheme(): Color[];
        fiveToneBScheme(): Color[];
        fiveToneCScheme(): Color[];
        fiveToneDScheme(): Color[];
        fiveToneEScheme(): Color[];
        sixToneCWScheme(): Color[];
        sixToneCCWScheme(): Color[];
        neutralScheme(): Color[];
        analogousScheme(): Color[];

        // conversion and construction
        toCSS(bytesPerChannel?: number): string;
        toString(): string;
        toHSV(): string;
        toRGB(): string;
        toHSL(): string;
    }
    
    // types used in construction of a Color 
    export interface ValuesObject { 
        alpha?: number;
    }

    export interface RGBAValues extends ValuesObject {
        red: number;
        green: number;
        blue: number;
    }

    export interface HSVAValue extends ValuesObject {
        hue: number;
        saturation: number;
        value: number;
    }

    export interface HSLValue extends ValuesObject {
        hue: number;
        saturation: number;
        lightness: number;
    }

    // public constructor
    function Color(): Color;
    function Color(cssColor: string): Color;
    function Color(color: ValuesObject): Color;
    function Color(color: number[]): Color;
}

