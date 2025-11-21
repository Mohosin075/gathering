import { Schema, model } from 'mongoose'
import bcrypt from 'bcrypt'
import { IUser, UserModel } from './user.interface'
import { USER_ROLES, USER_STATUS } from '../../../enum/user'

// ------------------ USER SCHEMA ------------------
const UserSchema = new Schema<IUser, UserModel>(
  {
    name: { type: String, trim: true },
    email: { type: String, unique: true, lowercase: true, required: true },
    profile: { type: String },
    businessName: { type: String },
    phone: { type: String },
    description: { type: String },
    specialty: { type: String },
    services: { type: [Schema.Types.ObjectId], ref: 'Service' },

    status: {
      type: String,
      enum: Object.values(USER_STATUS),
      default: USER_STATUS.ACTIVE,
    },
    verified: { type: Boolean, default: false },

    address: {
      city: String,
      postalCode: String,
      country: String,
      permanentAddress: String,
      presentAddress: String,
    },

    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        default: [0, 0], // [longitude, latitude]
      },
    },
    subscribe: { type: Boolean, default: false },

    password: { type: String, minlength: 6 },
    role: {
      type: String,
      enum: Object.values(USER_ROLES),
      default: USER_ROLES.CLIENT,
    },
    appId: { type: String },
    provider: { type: String },
    deviceToken: { type: String },
    timezone: { type: String, default: 'UTC' },

    authentication: {
      restrictionLeftAt: { type: Date, default: null },
      resetPassword: { type: Boolean, default: false },
      wrongLoginAttempts: { type: Number, default: 0 },
      passwordChangedAt: { type: Date },
      oneTimeCode: { type: String },
      latestRequestAt: { type: Date, default: Date.now },
      expiresAt: { type: Date },
      requestCount: { type: Number, default: 0 },
      authType: { type: String, enum: ['createAccount', 'resetPassword'] },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
)

// ------------------ INDEXES ------------------
UserSchema.index({ location: '2dsphere' }) // Geo queries support

// ------------------ PRE HOOKS ------------------
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  this.password = await bcrypt.hash(this.password, 10)
  next()
})

// ------------------ STATIC METHODS ------------------
UserSchema.statics.isPasswordMatched = async function (
  givenPassword: string,
  savedPassword: string,
): Promise<boolean> {
  return bcrypt.compare(givenPassword, savedPassword)
}

// ------------------ MODEL ------------------
export const User = model<IUser, UserModel>('User', UserSchema)
