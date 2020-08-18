import AppError from '@shared/errors/AppError';
import { getRepository, Repository, In } from 'typeorm';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICreateProductDTO from '@modules/products/dtos/ICreateProductDTO';
import IUpdateProductsQuantityDTO from '@modules/products/dtos/IUpdateProductsQuantityDTO';
import Product from '../entities/Product';

interface IFindProducts {
  id: string;
}

class ProductsRepository implements IProductsRepository {
  private ormRepository: Repository<Product>;

  constructor() {
    this.ormRepository = getRepository(Product);
  }

  public async create({
    name,
    price,
    quantity,
  }: ICreateProductDTO): Promise<Product> {
    const product = this.ormRepository.create({
      name,
      price,
      quantity,
    });

    await this.ormRepository.save(product);

    return product;
  }

  public async findByName(name: string): Promise<Product | undefined> {
    const findByName = await this.ormRepository.findOne({
      where: { name },
    });

    return findByName;
  }

  public async findAllById(products: IFindProducts[]): Promise<Product[]> {
    const ids = products.map(product => product.id);

    const orderList = await this.ormRepository.find({ id: In(ids) });

    if (ids.length !== orderList.length)
      throw new AppError('Missing Product in products list');

    return orderList;
  }

  public async updateQuantity(
    products: IUpdateProductsQuantityDTO[],
  ): Promise<Product[]> {
    const findProducts = await this.findAllById(products);
    const newProducts = findProducts.map(product => {
      const findProduct = products.find(
        productData => productData.id === product.id,
      );

      if (!findProduct) throw new AppError('Product not found');
      if (product.quantity < findProduct.quantity)
        throw new AppError('Insufficiente product quantity');

      const newProduct = product;

      newProduct.quantity -= findProduct.quantity;

      return newProduct;
    });

    await this.ormRepository.save(newProducts);

    return newProducts;
  }
}

export default ProductsRepository;
