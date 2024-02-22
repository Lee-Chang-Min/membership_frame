import swaggerJsdoc from "swagger-jsdoc";


const options = {
    swaggerDefinition: {
        openapi: "3.0.0",
        info: {
            title: "LEE CHANG MIN - API",
            version: "0.1.0",
            description: "Test API with express",
        },
        host: "localhost:4000",
        basePath: "/",
    },
    apis: ["src/routers/*.ts"],
};


export default swaggerJsdoc(options);
