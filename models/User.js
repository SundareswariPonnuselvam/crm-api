import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: function() {
      return !this.oauthProvider; // Password not required for OAuth users
    },
  },
  role: {
    type: String,
    enum: ['admin', 'telecaller'],
    default: 'telecaller',
  },
  oauthProvider: {
    type: String,
    enum: ['google', 'github'],
  },
  oauthId: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Only hash password if it's modified and not from OAuth
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password') || this.oauthProvider) {
    next();
  } else {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  }
});

UserSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false; // For OAuth users without password
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', UserSchema);
export default User;