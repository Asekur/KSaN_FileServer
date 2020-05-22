const express = require("express");
var fs = require("fs"); //for promise
const path = require("path"); //module for parsing the path
const app = express(); //new object of app
const fileupload = require("express-fileupload");
const dirname = __dirname + "/storedFiles";

app.use(express.static(path.join(__dirname, "public")));
app.use(fileupload());

app.listen(15000, () => {
    console.info("Server listening on port 15000");
});

app.get("/api", async(req, res) => {
    const files = await storedFiles(dirname);
    res.status(200).send(files);
});

//relative path
app.get("*", async(req, res) => {
    const marsh = dirname + req.path;
    //to check for the existence of a file
    fs.stat(marsh, async function(err, stat) {
        if (err) {
            res.status(404).send("Not Found");
        } else {
            if (fs.statSync(marsh).isDirectory()) {
                const files = await storedFiles(marsh);
                res.status(200).send(files);
            } else {
                res.status(200).sendFile(marsh);
            }
        }
    });
});

//for deleting files and cataloges
app.delete("*", async(req, res) => {
    //path to file
    const marsh = dirname + req.path;
    //to check for the existence of a file
    fs.stat(marsh, function(err, stat) {
        if (err) {
            res.status(404).send("Not Found");
        } else {
            if (fs.statSync(marsh).isFile()) {
                //delete files
                fs.unlink(marsh, function(err) {
                    if (err) {
                        res.status(500).send("Internal Server Error");
                    }
                });
            } else {
                //delete directories
                fs.rmdir(marsh, function(err) {
                    if (err) {
                        res.status(500).send("Internal Server Error");
                    }
                });
            }
            res.status(200).send("Deleted successfully");
        }
    });
});

//for adding file with rewrite
app.put("*", async(req, res) => {
    if (req.files) {
        const fileName = "/" + req.files.file.name;
        const marsh = dirname + req.path + fileName;
        const file = req.files.file.data;
        if (fs.existsSync(dirname + req.path)) {
            fs.writeFile(marsh, file, function(err) {
                if (err) {
                    res.status(400).send("Bad request");
                    return;
                }
            });
            res.status(200).send("Added successfully");
        } else {
            res.status(404).send("Not Found");
        }
    } else {
        res.status(400).send("Bad request");
    }
});

//for coping file
app.post("*", async(req, res) => {
    //old path to file
    const marsh = dirname + req.path;
    //new path to file from postman
    const newPath = dirname + req.headers["copy"];
    try {
        //check for existence of file
        if (fs.existsSync(newPath) && fs.statSync(newPath).isFile()) {
            try {
                res.status(200).send("Copied successfully");
                await fs.copyFile(newPath, marsh, function(err) {
                    if (err) {
                        res.status(404).send("Not Found");
                    }
                });
            } catch (err) {
                console.info(err);
                res.status(404).send("Not Found");
            }
        } else {
            res.status(404).send("Not Found");
        }
    } catch (err) {
        console.info(err);
    }
});

//get all files from "storedFiles"
async function storedFiles(dir, files_) {
    files_ = files_ || [];
    let files = fs.readdirSync(dir);
    for (var index in files) {
        var name = dir + "/" + files[index];
        if (fs.statSync(name).isDirectory()) {
            storedFiles(name, files_);
        } else {
            files_.push(path.relative(__dirname, name));
        }
    }
    return files_;
}