/*
The code below is a refactoring of:
- the ElecFreaks 'pxt-PlanetX' library:
  https://github.com/elecfreaks/pxt-PlanetX/blob/master/basic.ts
Both under MIT-license.
*/

namespace ColorSensor {

    function rgb2color(color_r: number, color_g: number, color_b: number): Color {
        let R = color_r / 255;
        let G = color_g / 255;
        let B = color_b / 255;
        let max = -1
        let min = -1
        let hue = 0

        if (R > G && R > B) max = R
        if (G > R && G > B) max = G
        if (B > R && B > G) max = B
        if (R < G && R < B) min = R
        if (G < R && G < B) min = G
        if (B < R && B < G) min = B

        if (R == max) hue = (0 + (G - B) / (max - min)) * 60
        if (G == max) hue = (2 + (B - R) / (max - min)) * 60
        if (B == max) hue = (4 + (R - G) / (max - min)) * 60

        if (hue < 0) hue += 360

        // translate hue to color

        // MEASURED VALUES:
        // ================
        // light yellow = 140, 165
        // yellow = 64, 59
        // dark yellow = 44, 44
        // orange = 3, 3
        // light green = 180, 186
        // green = 154, 150
        // dark green = 154, 149
        // very dark green = 168, 166
        // licht blue = 196, 200
        // blue = 211, 211
        // indigo = 220, 220
        // very dark blue = 218, 218
        // light purple = 218, 220
        // purple = 230, 260
        // light pink = 264, 264
        // dark pink = 279, 279
        // red = 347, 348
        // very dark red = 325, 325
        // brown = 7, 8
        // dark brown = 269, 272
        // grey = 214, 213
        // black = 214, 214

        //  3 = orange
        //  7 = brown
        // 44 = dark yellow
        // 62 = yellow
        // 152 = green
        // 167 = dark green
        // 182 = light green
        // 198 = light blue
        // 211 = blue
        // 214 = grey, black
        // 219 = indigo, light purple
        // 240 = purple
        // 264 = pink
        // 279 = magenta
        // 325 = dark red
        // 348 = red

        if (hue == 0) return Color.White
        if (hue < 5) return Color.Orange
        if (hue < 30) return Color.Brown
        if (hue < 100) return Color.Yellow
        if (hue < 190) return Color.Green
        if (hue < 206) return Color.Cyan
        if (hue < 213) return Color.Blue
        if (hue < 217) return Color.Black
        if (hue < 230) return Color.Indigo
        if (hue < 255) return Color.Purple
        if (hue < 272) return Color.Pink
        if (hue < 300) return Color.Magenta
        return Color.Red
    }

    const APDS9960_ADDR = 0x39
    const APDS9960_ENABLE = 0x80
    const APDS9960_ATIME = 0x81
    const APDS9960_CONTROL = 0x8F
    const APDS9960_STATUS = 0x93
    const APDS9960_CDATAL = 0x94
    const APDS9960_CDATAH = 0x95
    const APDS9960_RDATAL = 0x96
    const APDS9960_RDATAH = 0x97
    const APDS9960_GDATAL = 0x98
    const APDS9960_GDATAH = 0x99
    const APDS9960_BDATAL = 0x9A
    const APDS9960_BDATAH = 0x9B
    const APDS9960_GCONF4 = 0xAB
    const APDS9960_AICLEAR = 0xE7

    let color_first_init = false
    let color_new_init = false

    function i2cwrite_color(addr: number, reg: number, value: number) {
        let buf = pins.createBuffer(2)
        buf[0] = reg
        buf[1] = value
        pins.i2cWriteBuffer(addr, buf)
    }

    function i2cread_color(addr: number, reg: number) {
        pins.i2cWriteNumber(addr, reg, NumberFormat.UInt8BE);
        let val = pins.i2cReadNumber(addr, NumberFormat.UInt8BE);
        return val;
    }

    export function init() {

        // init module
        i2cwrite_color(APDS9960_ADDR, APDS9960_ATIME, 252)
        i2cwrite_color(APDS9960_ADDR, APDS9960_CONTROL, 0x03)
        i2cwrite_color(APDS9960_ADDR, APDS9960_ENABLE, 0x00)
        i2cwrite_color(APDS9960_ADDR, APDS9960_GCONF4, 0x00)
        i2cwrite_color(APDS9960_ADDR, APDS9960_AICLEAR, 0x00)
        i2cwrite_color(APDS9960_ADDR, APDS9960_ENABLE, 0x01)
        color_first_init = true

        // set to color mode
        let tmp = i2cread_color(APDS9960_ADDR, APDS9960_ENABLE) | 0x2;
        i2cwrite_color(APDS9960_ADDR, APDS9960_ENABLE, tmp);
    }

    export function read(): Color {
        let buf = pins.createBuffer(2)
        let c = 0
        let r = 0
        let g = 0
        let b = 0
        let temp_c = 0
        let temp_r = 0
        let temp_g = 0
        let temp_b = 0
        let temp = 0

        if (color_new_init == false && color_first_init == false) {
            let i = 0;
            while (i++ < 15) {
                buf[0] = 0x81
                buf[1] = 0xCA
                pins.i2cWriteBuffer(0x43, buf)
                buf[0] = 0x80
                buf[1] = 0x17
                pins.i2cWriteBuffer(0x43, buf)
                basic.pause(50);

                if ((i2cread_color(0x43, 0xA4) + i2cread_color(0x43, 0xA5) * 256) != 0) {
                    color_new_init = true
                    break;
                }
            }
        }
        if (color_new_init == true) {
            basic.pause(150);
            c = i2cread_color(0x43, 0xA6) + i2cread_color(0x43, 0xA7) * 256;
            r = i2cread_color(0x43, 0xA0) + i2cread_color(0x43, 0xA1) * 256;
            g = i2cread_color(0x43, 0xA2) + i2cread_color(0x43, 0xA3) * 256;
            b = i2cread_color(0x43, 0xA4) + i2cread_color(0x43, 0xA5) * 256;

            r *= 1.3 * 0.47 * 0.83
            g *= 0.69 * 0.56 * 0.83
            b *= 0.80 * 0.415 * 0.83
            c *= 0.3

            if (r > b && r > g) {
                b *= 1.18;
                g *= 0.95
            }

            temp_c = c
            temp_r = r
            temp_g = g
            temp_b = b

            r = Math.min(r, 4095.9356)
            g = Math.min(g, 4095.9356)
            b = Math.min(b, 4095.9356)
            c = Math.min(c, 4095.9356)

            if (temp_b < temp_g) {
                temp = temp_b
                temp_b = temp_g
                temp_g = temp
            }
        }
        else {
            if (color_first_init == false)
                init()
            let tmp = i2cread_color(APDS9960_ADDR, APDS9960_STATUS) & 0x1;
            while (!tmp) {
                basic.pause(5);
                tmp = i2cread_color(APDS9960_ADDR, APDS9960_STATUS) & 0x1;
            }
            c = i2cread_color(APDS9960_ADDR, APDS9960_CDATAL) + i2cread_color(APDS9960_ADDR, APDS9960_CDATAH) * 256;
            r = i2cread_color(APDS9960_ADDR, APDS9960_RDATAL) + i2cread_color(APDS9960_ADDR, APDS9960_RDATAH) * 256;
            g = i2cread_color(APDS9960_ADDR, APDS9960_GDATAL) + i2cread_color(APDS9960_ADDR, APDS9960_GDATAH) * 256;
            b = i2cread_color(APDS9960_ADDR, APDS9960_BDATAL) + i2cread_color(APDS9960_ADDR, APDS9960_BDATAH) * 256;
        }

        // map to rgb based on clear channel
        let avg = c / 3;
        r = r * 255 / avg;
        g = g * 255 / avg;
        b = b * 255 / avg;

        return rgb2color(r, g, b)
    }
}
