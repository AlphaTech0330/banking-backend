const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
    {
        fullName: {
            type: String,
            required: true,
            trim: true,
        },
        email:{
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        passwordHash: {
            type: String,
            required: true,
        },
        phone: {
            type: String,
        },

        //Onboarding / KYC fields
        idType:{
            type: String,
            enum: ['BVN', 'NIN'],
            default: null,
        },
        idValue: {
            type: String,
            default: null,
        },
        nibssCustomerRef: {
            type: String,
            default: null,
        },
        isVerified: {
            type: Boolean,
            default: false, 
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Customer', customerSchema);
