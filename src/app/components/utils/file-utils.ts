import {FileSelectEvent} from "primeng/fileupload";

export function readFile<T>(event: FileSelectEvent): Promise<T> {
    const file: File = event.files[0];

    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const text = (e.target as FileReader).result as string;
                const jsonData = JSON.parse(text) as T;
                resolve(jsonData);
            } catch (error) {
                reject('Error parsing JSON: ' + error);
            }
        };

        reader.onerror = (error) => {
            reject('Error reading file: ' + error);
        };

        reader.readAsText(file);
    });
}