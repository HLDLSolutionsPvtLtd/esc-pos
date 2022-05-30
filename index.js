const parseISO = require("date-fns").parseISO;
const format = require("date-fns").format;
const escpos = require("escpos");
// install escpos-usb adapter module manually
escpos.USB = require("escpos-usb");

function printReceipt(req) {
    let data = req.data;
    let taxGroup = [];

    data.products.forEach((element) => {
        insert(element);
    });

    function insert(el) {
        let index = taxGroup.findIndex((gr) => {
            if (el.inventory.gst_percent == gr.percent) {
                return true;
            }
        });

        if (el.inventory.gst_percent != 0) {
            if (taxGroup[index]) {
                taxGroup[index].total =
                    parseFloat(
                        (Number(el.inventory.selling_price) *
                            Number(el.inventory.gst_percent)) /
                            100
                    ) + parseFloat(taxGroup[index].total);
            } else {
                taxGroup.push({
                    percent: el.inventory.gst_percent,
                    total: parseFloat(
                        (Number(el.inventory.selling_price) *
                            Number(el.inventory.gst_percent)) /
                            100
                    ),
                });
            }
        }
    }
    // Select the adapter based on your printer type
    const device = new escpos.USB();
    // const device  = new escpos.Network('localhost');
    // const device  = new escpos.Serial('/dev/usb/lp0');

    const options = { encoding: "UTF-8" /* default */, width: 63 };
    // encoding is optional

    const printer = new escpos.Printer(device, options);

    const discount = data.products.reduce(
        (aggr, product) => {
            if (product.pivot.discount_amount != "") {
                return {
                    ...aggr,
                    amount:
                        aggr.amount + parseFloat(product.pivot.discount_amount),
                    quantity: product.pivot.quantity,
                };
            } else {
                return { ...aggr, amount: parseFloat(aggr.amount) + 0 };
            }
        },
        { quantity: 0, amount: 0 }
    );

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
                { text: "FamCart", align: "LEFT", width: 0.5 },
                {
                    text: format(parseISO(data.created_at), "hh:mm aaa"),
                    align: "RIGHT",
                    width: 0.5,
                },
            ])
            .tableCustom([
                {
                    text: "Address: Chaltlang Ruam Veng",
                    align: "LEFT",
                    width: 0.5,
                },
                {
                    text: format(parseISO(data.created_at), "dd-MM-Y"),
                    align: "RIGHT",
                    width: 0.5,
                },
            ])

            .tableCustom([
                { text: "Contact: 343463", align: "LEFT", width: 0.5 },
                {
                    text: "Employee ID: " + req.emp_id,
                    align: "RIGHT",
                    width: 0.5,
                },
            ])

            .tableCustom([
                {
                    text: "Customer Contact: " + data.customer.phone_no,
                    align: "LEFT",
                    width: 0.5,
                },
                {
                    text: "Store Name: " + data.store.name,
                    align: "RIGHT",
                    width: 0.5,
                },
            ]);

        printer.drawLine();
        printer.tableCustom([
            { text: "ITEM", align: "LEFT", width: 0.5 },
            { text: "PRICE", align: "RIGHT", width: 0.5 },
        ]);
        data.products.forEach((element) => {
            let sellingPrice = parseFloat(
                element.inventory.selling_price
            ).toFixed(2);

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
                        sellingPrice,
                    align: "RIGHT",
                    width: 0.5,
                },
            ]);
        });
        printer.drawLine();
        printer.tableCustom([
            { text: "TAX BREAKDOWN", align: "LEFT", width: 0.5 },
            { text: "AMOUNT", align: "RIGHT", width: 0.5 },
        ]);
        taxGroup.forEach((element) => {
            printer.tableCustom([
                {
                    text: element.percent + "%",
                    align: "LEFT",
                    width: 0.5,
                },
                {
                    text: "Rs. " + parseFloat(element.total).toFixed(2),
                    align: "RIGHT",
                    width: 0.5,
                },
            ]);
        });
        printer.drawLine();

        const productsTotal = data.products.reduce((aggr, product) => {
            return (
                aggr +
                parseFloat(product.inventory.selling_price) *
                    parseFloat(product.pivot.quantity)
            );
        }, 0);

        printer.tableCustom([
            { text: "SUB TOTAL", align: "LEFT", width: 0.5 },
            {
                text: "Rs. " + productsTotal.toFixed(2),
                align: "RIGHT",
                width: 0.5,
            },
        ]);
        if (discount.amount > 0)
            printer.tableCustom([
                { text: "DISCOUNT", align: "LEFT", width: 0.5 },
                {
                    text:
                        "(- Rs. " +
                        (
                            parseFloat(discount.amount) *
                            parseFloat(discount.quantity)
                        ).toFixed(2) +
                        ") " +
                        `Rs. ${parseFloat(data.total_without_gst).toFixed(2)}`,
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
