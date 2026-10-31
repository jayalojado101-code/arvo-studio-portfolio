
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const IMAGES_FOLDER = path.join(ROOT, "images");
const OUTPUT_FOLDER = path.join(ROOT, "dist");

const IMAGE_EXTENSIONS = /\.(jpg|jpeg|png|webp|gif)$/i;

function copyFolder(source, destination) {
    if (!fs.existsSync(source)) return;

    fs.mkdirSync(destination, { recursive: true });

    for (const item of fs.readdirSync(source, {
        withFileTypes: true
    })) {
        const sourcePath = path.join(source, item.name);
        const destinationPath = path.join(destination, item.name);

        if (item.isDirectory()) {
            copyFolder(sourcePath, destinationPath);
        } else {
            fs.copyFileSync(sourcePath, destinationPath);
        }
    }
}

function generateGallery() {
    if (!fs.existsSync(IMAGES_FOLDER)) {
        throw new Error("Images folder not found.");
    }

    fs.rmSync(OUTPUT_FOLDER, {
        recursive: true,
        force: true
    });

    fs.mkdirSync(OUTPUT_FOLDER, {
        recursive: true
    });

    // Copy the main website files
    for (const file of ["index.html", "style.css", "script.js"]) {
        const source = path.join(ROOT, file);

        if (!fs.existsSync(source)) {
            throw new Error(`${file} not found.`);
        }

        fs.copyFileSync(
            source,
            path.join(OUTPUT_FOLDER, file)
        );
    }

    // Copy all images and category folders
    copyFolder(
        IMAGES_FOLDER,
        path.join(OUTPUT_FOLDER, "images")
    );

    // Generate gallery data
    const gallery = {};

    const folders = fs.readdirSync(IMAGES_FOLDER, {
        withFileTypes: true
    });

    for (const folder of folders) {
        if (!folder.isDirectory()) continue;

        const categoryName = folder.name;
        const categoryPath = path.join(
            IMAGES_FOLDER,
            categoryName
        );

        const files = fs.readdirSync(categoryPath);

        gallery[categoryName] = files
            .filter(file => IMAGE_EXTENSIONS.test(file))
            .sort((a, b) =>
                a.localeCompare(b, undefined, {
                    numeric: true,
                    sensitivity: "base"
                })
            )
            .map(file => ({
                filename: file,
                url: `/images/${encodeURIComponent(categoryName)}/${encodeURIComponent(file)}`
            }));
    }

    fs.writeFileSync(
        path.join(OUTPUT_FOLDER, "gallery.json"),
        JSON.stringify({
            success: true,
            gallery
        }, null, 2)
    );

    console.log("ARVO STUDIO GALLERY GENERATED!");
    console.log("Output folder:", OUTPUT_FOLDER);
}

try {
    generateGallery();
} catch (error) {
    console.error("Gallery generation failed:", error.message);
    process.exit(1);
}
