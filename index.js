const escpos = require("escpos");
// install escpos-usb adapter module manually
escpos.USB = require("escpos-usb");

function printReceipt(data) {
    // Select the adapter based on your printer type
    const device = new escpos.USB();
    // const device  = new escpos.Network('localhost');
    // const device  = new escpos.Serial('/dev/usb/lp0');

    const options = { encoding: "GB18030" /* default */ };
    // encoding is optional

    const printer = new escpos.Printer(device, options);

    device.open(function () {
        printer
            .font("a")
            .align("ct")
            .style("bu")
            .size(1, 1)
            .text("Rinawma Hmelchhe ber e")
            .text("Hmelchhe bawk, zu heh bawk")
            .barcode("1234567", "EAN8")
            .table(["One", "Two", "Three"])
            .tableCustom(
                [
                    { text: "Left", align: "LEFT", width: 0.33, style: "B" },
                    { text: "Center", align: "CENTER", width: 0.33 },
                    { text: "Right", align: "RIGHT", width: 0.33 },
                ],
                { encoding: "cp857", size: [1, 1] } // Optional
            )
            .qrimage("https://github.com/song940/node-escpos", function () {
                this.cut();
                this.close();
            });
    });
}

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();

const corsOptions = {
    origin: ["http://localhost:8000"],
};

app.use(bodyParser.json());
app.use(cors(corsOptions));
app.use(bodyParser.urlencoded({ extended: true }));

app.post("/print-receipt", cors(corsOptions), (req, res) => {
    printReceipt(req.body);

    res.sendStatus(204);
});

app.listen(3000, () => console.log("Webhook server is listening, port 3000"));
