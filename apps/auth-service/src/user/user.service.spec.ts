import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { UserService } from './user.service';
import { User } from './schemas/user.schema';

const mockUserDoc = (overrides: any = {}) => {
  const base = {
    _id: 'user123',
    email: 'dana@test.com',
    firstName: 'Dana',
    lastName: 'Cohen',
    password: 'hashed',
    googleId: null,
    facebookId: null,
    currentHashedRefreshToken: null,
    ...overrides,
  };
  return { ...base, toObject: () => base };
};

describe('UserService', () => {
  let service: UserService;
  let model: any;

  const mockSave = jest.fn();

  beforeEach(async () => {
    const MockModel: any = jest.fn().mockImplementation(() => ({ save: mockSave }));
    MockModel.findOne = jest.fn();
    MockModel.findById = jest.fn();
    MockModel.find = jest.fn();
    MockModel.findByIdAndUpdate = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: getModelToken(User.name), useValue: MockModel },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    model = MockModel;
    mockSave.mockResolvedValue(mockUserDoc());
  });

  afterEach(() => jest.clearAllMocks());

  // ─── create ───
  describe('create', () => {
    it('constructs document and calls save()', async () => {
      const dto = { email: 'dana@test.com', firstName: 'Dana', lastName: 'Cohen', password: 'hashed' };
      const result = await service.create(dto as any);
      expect(model).toHaveBeenCalledWith(dto);
      expect(mockSave).toHaveBeenCalled();
      expect(result.email).toBe('dana@test.com');
    });
  });

  // ─── findByEmail ───
  describe('findByEmail', () => {
    it('returns user when found', async () => {
      model.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(mockUserDoc()) });
      const result = await service.findByEmail('dana@test.com');
      expect(model.findOne).toHaveBeenCalledWith({ email: 'dana@test.com' });
      expect(result?.email).toBe('dana@test.com');
    });

    it('returns null when not found', async () => {
      model.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
      expect(await service.findByEmail('none@test.com')).toBeNull();
    });
  });

  // ─── findByGoogleId ───
  describe('findByGoogleId', () => {
    it('returns user by googleId', async () => {
      model.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(mockUserDoc({ googleId: 'g123' })) });
      const result = await service.findByGoogleId('g123');
      expect(model.findOne).toHaveBeenCalledWith({ googleId: 'g123' });
      expect(result?.googleId).toBe('g123');
    });

    it('returns null when not found', async () => {
      model.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
      expect(await service.findByGoogleId('unknown')).toBeNull();
    });
  });

  // ─── findByFacebookId ───
  describe('findByFacebookId', () => {
    it('returns user by facebookId', async () => {
      model.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(mockUserDoc({ facebookId: 'fb123' })) });
      const result = await service.findByFacebookId('fb123');
      expect(model.findOne).toHaveBeenCalledWith({ facebookId: 'fb123' });
      expect(result?.facebookId).toBe('fb123');
    });

    it('returns null when not found', async () => {
      model.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
      expect(await service.findByFacebookId('unknown')).toBeNull();
    });
  });

  // ─── findById ───
  describe('findById', () => {
    it('finds user by id', async () => {
      model.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(mockUserDoc()) });
      const result = await service.findById('user123');
      expect(model.findById).toHaveBeenCalledWith('user123');
      expect(result?._id).toBe('user123');
    });

    it('returns null when not found', async () => {
      model.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
      expect(await service.findById('none')).toBeNull();
    });
  });

  // ─── search ───
  describe('search', () => {
    it('returns [] for query shorter than 2 characters', async () => {
      expect(await service.search('a', 'user123')).toEqual([]);
      expect(model.find).not.toHaveBeenCalled();
    });

    it('returns [] for empty string', async () => {
      expect(await service.search('', 'user123')).toEqual([]);
    });

    it('returns [] for whitespace-only string', async () => {
      expect(await service.search('  ', 'user123')).toEqual([]);
    });

    it('queries with regex, excludes self', async () => {
      const users = [mockUserDoc()];
      model.find.mockReturnValue({
        limit: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(users) }),
      });
      const result = await service.search('dana', 'other-id');
      expect(model.find).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: { $ne: 'other-id' },
          $or: expect.any(Array),
        }),
      );
      expect(result).toEqual(users);
    });

    it('escapes regex special characters', async () => {
      model.find.mockReturnValue({
        limit: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([]) }),
      });
      await service.search('test.user+', 'other-id');
      const callArg = model.find.mock.calls[0][0];
      expect(callArg.$or[0].firstName.source).toContain('\\.');
      expect(callArg.$or[0].firstName.source).toContain('\\+');
    });

    it('respects default limit of 10', async () => {
      const limitMock = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([]) });
      model.find.mockReturnValue({ limit: limitMock });
      await service.search('dana', 'other-id');
      expect(limitMock).toHaveBeenCalledWith(10);
    });
  });

  // ─── update ───
  describe('update', () => {
    it('calls findByIdAndUpdate with { new: true } and returns updated doc', async () => {
      const updated = mockUserDoc({ firstName: 'Updated' });
      model.findByIdAndUpdate.mockReturnValue({ exec: jest.fn().mockResolvedValue(updated) });
      const result = await service.update('user123', { firstName: 'Updated' } as any);
      expect(model.findByIdAndUpdate).toHaveBeenCalledWith('user123', { firstName: 'Updated' }, { new: true });
      expect(result?.firstName).toBe('Updated');
    });
  });

  // ─── setCurrentRefreshToken ───
  describe('setCurrentRefreshToken', () => {
    it('updates the hashed refresh token field', async () => {
      model.findByIdAndUpdate.mockResolvedValue(null);
      await service.setCurrentRefreshToken('hashed-token', 'user123');
      expect(model.findByIdAndUpdate).toHaveBeenCalledWith('user123', {
        currentHashedRefreshToken: 'hashed-token',
      });
    });
  });

  // ─── removeRefreshToken ───
  describe('removeRefreshToken', () => {
    it('nullifies the refresh token field', async () => {
      model.findByIdAndUpdate.mockResolvedValue(null);
      await service.removeRefreshToken('user123');
      expect(model.findByIdAndUpdate).toHaveBeenCalledWith('user123', {
        currentHashedRefreshToken: null,
      });
    });
  });
});
