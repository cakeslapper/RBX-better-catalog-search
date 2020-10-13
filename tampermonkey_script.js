// ==UserScript==
// @name         Remove Clothes Duplicates
// @version      0.1
// @description  Remove the duplicate shirts and pants in the roblox catalog
// @author       Danielle
// @match        https://api.roblox.com/*
// @require      https://bundle.run/pixelmatch
// ==/UserScript==

/* global pixelmatch */
const perfectThreshold = .5;

const category = "&Category=3&Subcategory=12"
const keywordSearch = "20021";

const uniqueClothes = [];

let nextPageCursor = "";
const baseApiUrl = "https://catalog.roblox.com/v1/search/items/details?Keyword=" + keywordSearch + category + "&cursor=";
let usedApiUrl = baseApiUrl + nextPageCursor;

function getLink(text) {
    const linkIDstartIndex = text.indexOf("tr.rbxcdn.com/") + 14;
    const linkIDendIndex = text.indexOf("/", linkIDstartIndex + 1);
    const linkID = text.slice(linkIDstartIndex, linkIDendIndex);
    const clothingType = "Shirt";
    const link = "https://tr.rbxcdn.com/" + linkID + "/420/420/" + clothingType + "/Png";
    return link;
}

function createImg(thumbnailLink) {
    const img = new Image();
    img.src = thumbnailLink;
    img.crossOrigin = "Anonymous";
    return img;
}

function getImgData(img) {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    return data;
}

function appendImg(img) {
    img.style.maxWidth = '150px';
    img.style.maxHeight = '150px';
    const place = document.getElementById("Assets");
    place.appendChild(img);
}

function bothEqualImgData(a, b) {
    return (pixelmatch(a.imageData, b.imageData, null, 420, 420, {
        threshold: perfectThreshold
    }) == 0);
}

function addIfUnique(eachClothing) {
    const duplicate = uniqueClothes.some((uniqueClothing) => bothEqualImgData(eachClothing, uniqueClothing));
    if (duplicate == false) {
        uniqueClothes.push(eachClothing);
    }
}

function addToUniqueClothes(thumbnailLink, catalogLink) {
    if (!thumbnailLink.includes("html")) {
        const img = createImg(thumbnailLink);
        img.onload = function() {
            const data = getImgData(img);

            const eachClothing = {
                "catalogLink": catalogLink,
                "imageData": data
            }
            addIfUnique(eachClothing);
        }
    }
}

async function addEachClothing(catalogIDs) {
    let catalogIDlength = catalogIDs.length;
    for (let i = 0; i < catalogIDlength; ++i) {
        const catalogID = catalogIDs[i];

        const catalogLink = "https://www.roblox.com/catalog/" + catalogID;
        const catalogItemResponse = await fetch(catalogLink);
        const catalogItemText = await catalogItemResponse.text();
        const thumbnailLink = getLink(catalogItemText);
        addToUniqueClothes(thumbnailLink, catalogLink);
    }
}

async function main() {
    try {
        const apiResponse = await fetch(usedApiUrl)
        const apiJSON = await apiResponse.json()

        nextPageCursor = apiJSON.nextPageCursor;
        usedApiUrl = baseApiUrl + nextPageCursor;
        const catalogIDs = [];
        const JSONdata = apiJSON.data;
        for (let i=0; i<JSONdata.length; ++i) {
            catalogIDs.push(JSONdata[i].id);
        }
        addEachClothing(catalogIDs);
        console.log("finished a page");
    } catch(error) {
        throw 500;
    } finally {
        if (nextPageCursor != null) {
            main();
        } else {
            console.log("unique clothes: ");
            console.log(uniqueClothes);
        }
    }
}

main();
