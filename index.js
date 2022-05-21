const parseISO = require("date-fns").parseISO;
const format = require("date-fns").format;
const escpos = require("escpos");
// install escpos-usb adapter module manually
escpos.USB = require("escpos-usb");

function printReceipt(data) {
    // Select the adapter based on your printer type
    const device = new escpos.USB();
    // const device  = new escpos.Network('localhost');
    // const device  = new escpos.Serial('/dev/usb/lp0');

    const options = { encoding: "UTF-8" /* default */, width: 63 };
    // encoding is optional

    const printer = new escpos.Printer(device, options);

    device.open(function () {
        printer
            .font("a")
            .align("ct")
            .style("b")
            .size(1, 1)
            .text("FAMCART POS RECEIPT");

        printer
            .style("")
            .size(0, 0)
            .text("------------------------------------------------");
        printer
            .font("b")
            .align("lt")
            .style("")
            .size(0, 0)
            .tableCustom([
                { text: "Famcart", align: "LEFT", width: 0.5 },
                {
                    text: format(parseISO(data.created_at), "hh:mm aaa"),
                    align: "RIGHT",
                    width: 0.5,
                },
            ])
            .tableCustom([
                { text: "Address: Chaltlang", align: "LEFT", width: 0.5 },
                {
                    text: format(parseISO(data.created_at), "dd-MM-Y"),
                    align: "RIGHT",
                    width: 0.5,
                },
            ])

            .tableCustom([
                { text: "Contact: 343463", align: "LEFT", width: 0.5 },
                { text: "Employee ID: EMP-1", align: "RIGHT", width: 0.5 },
            ]);

        printer.drawLine();
        printer.tableCustom([
            { text: "ITEM", align: "LEFT", width: 0.5 },
            { text: "PRICE", align: "RIGHT", width: 0.5 },
        ]);
        data.products.forEach((element) => {
            printer.tableCustom([
                {
                    text: element.inventory.item.name,
                    align: "LEFT",
                    width: 0.5,
                },
                {
                    text:
                        element.pivot.quantity +
                        " " +
                        element.inventory.item.unit_measurement
                            .charAt(0)
                            .toUpperCase() +
                        element.inventory.item.unit_measurement.slice(1) +
                        " x " +
                        "Rs. " +
                        parseFloat(element.inventory.selling_price).toFixed(2),
                    align: "RIGHT",
                    width: 0.5,
                },
            ]);
        });
        printer.drawLine();
        printer.tableCustom([
            { text: "SUB TOTAL", align: "LEFT", width: 0.5 },
            {
                text: "Rs. " + parseFloat(data.total_without_gst).toFixed(2),
                align: "RIGHT",
                width: 0.5,
            },
        ]);
        printer.tableCustom([
            { text: "TAX", align: "LEFT", width: 0.5 },
            {
                text:
                    "Rs. " +
                    (data.total_with_gst - data.total_without_gst).toFixed(2),
                align: "RIGHT",
                width: 0.5,
            },
        ]);
        printer.tableCustom([
            { text: "TOTAL PAYABLE", align: "LEFT", width: 0.5 },
            {
                text: "Rs. " + parseFloat(data.total_with_gst).toFixed(2),
                align: "RIGHT",
                width: 0.5,
            },
        ]);

        printer.drawLine();

        printer
            .font("b")
            .align("ct")
            .size(0, 0)
            .text("THANK YOU FOR CHOOSING US");

        printer.font("a").align("ct").size(0, 0).text("www.famcart.in");

        printer
            .style("")
            .size(0, 0)
            .text("------------------------------------------------");

        printer.cut();
        printer.close();
    });
}

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();

const corsOptions = {
    origin: ["http://localhost:8080", "http://localhost:8000"],
};

app.use(bodyParser.json());
app.use(cors(corsOptions));
app.use(bodyParser.urlencoded({ extended: true }));

app.post("/print-receipt", cors(corsOptions), (req, res) => {
    printReceipt(req.body);

    res.sendStatus(204);
});

app.listen(3000, () => console.log("Webhook server is listening, port 3000"));
