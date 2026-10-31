
const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

const IMAGE_FOLDER = path.join(__dirname, "images");

// Serve website files
app.use(express.static(__dirname));

// API: Automatically read all category folders and images
app.get("/api/gallery", (req, res) => {
    try {
        if (!fs.existsSync(IMAGE_FOLDER)) {
            return res.status(404).json({
                success: false,
                message: "Images folder not found."
            });
        }

        const categories = fs.readdirSync(IMAGE_FOLDER, {
            withFileTypes: true
        });

        const gallery = {};

        categories.forEach((category) => {
            if (!category.isDirectory()) return;

            const categoryName = category.name;
            const categoryPath = path.join(
                IMAGE_FOLDER,
                categoryName
            );

            const files = fs.readdirSync(categoryPath);

            const images = files
                .filter((file) =>
                    /\.(jpg|jpeg|png|webp|gif)$/i.test(file)
                )
                .sort((a, b) =>
                    a.localeCompare(b, undefined, {
                        numeric: true,
                        sensitivity: "base"
                    })
                )
                .map((file) => ({
                    filename: file,
                    url: `/images/${encodeURIComponent(categoryName)}/${encodeURIComponent(file)}`
                }));

            gallery[categoryName] = images;
        });

        res.json({
            success: true,
            gallery: gallery
        });

    } catch (error) {
        console.error("Gallery error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to load gallery images."
        });
    }
});

app.listen(PORT, () => {
    console.log("--------------------------------");
    console.log("ARVO STUDIO GALLERY SERVER");
    console.log("--------------------------------");
    console.log(`Website: http://localhost:${PORT}`);
    console.log(`Gallery API: http://localhost:${PORT}/api/gallery`);
    console.log("--------------------------------");
});
